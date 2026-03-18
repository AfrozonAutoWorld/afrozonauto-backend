import axios, { AxiosInstance } from 'axios';
import * as bcrypt from 'bcrypt';
import { inject, injectable } from 'inversify';
import { TYPES } from '../config/types';
import { PayoutRepository } from '../repositories/PayoutRepository';
import { ApiError } from '../utils/ApiError';
import { WithdrawalStatus } from '../generated/prisma/enums';
import { PAYSTACK_SECRET_KEY } from '../secrets';

const MIN_WITHDRAWAL_USD = 10;

@injectable()
export class PayoutService {
  private paystack: AxiosInstance;

  constructor(
    @inject(TYPES.PayoutRepository)
    private payoutRepository: PayoutRepository,
  ) {
    const secretKey = PAYSTACK_SECRET_KEY || '';
    this.paystack = axios.create({
      baseURL: 'https://api.paystack.co',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 30_000,
    });
  }

  // ─── PIN Management ───────────────────────────────────────────────────────────

  async setupPin(userId: string, pin: string) {
    this.validatePinFormat(pin);
    const existing = await this.payoutRepository.getUserPayoutPin(userId);
    if (existing?.payoutPinSet) {
      throw ApiError.conflict('Payout PIN already set. Use change-pin to update it.');
    }
    const hashed = await bcrypt.hash(pin, 10);
    await this.payoutRepository.setPayoutPin(userId, hashed);
    return { message: 'Payout PIN set successfully.' };
  }

  async changePin(userId: string, oldPin: string, newPin: string) {
    this.validatePinFormat(newPin);
    const record = await this.payoutRepository.getUserPayoutPin(userId);
    if (!record?.payoutPinSet || !record.payoutPin) {
      throw ApiError.badRequest('No payout PIN set. Use setup-pin first.');
    }
    const match = await bcrypt.compare(oldPin, record.payoutPin);
    if (!match) throw ApiError.forbidden('Current PIN is incorrect.');
    const hashed = await bcrypt.hash(newPin, 10);
    await this.payoutRepository.setPayoutPin(userId, hashed);
    return { message: 'Payout PIN updated successfully.' };
  }

  private async verifyPin(userId: string, pin: string) {
    const record = await this.payoutRepository.getUserPayoutPin(userId);
    if (!record?.payoutPinSet || !record.payoutPin) {
      throw ApiError.badRequest('Payout PIN not set. Please set a PIN before withdrawing.');
    }
    const match = await bcrypt.compare(pin, record.payoutPin);
    if (!match) throw ApiError.forbidden('Invalid payout PIN.');
  }

  private validatePinFormat(pin: string) {
    if (!/^\d{4,6}$/.test(pin)) {
      throw ApiError.validationError('PIN must be 4–6 digits.');
    }
  }

  // ─── Banks ────────────────────────────────────────────────────────────────────

  async listBanks() {
    const res = await this.paystack.get('/bank', {
      params: { country: 'nigeria', use_cursor: false, perPage: 200 },
    });
    return res.data.data as Array<{ name: string; code: string; slug: string }>;
  }

  async verifyAccountNumber(accountNumber: string, bankCode: string) {
    try {
      const res = await this.paystack.get('/bank/resolve', {
        params: { account_number: accountNumber, bank_code: bankCode },
      });
      return res.data.data as { account_name: string; account_number: string; bank_id: number };
    } catch (err: any) {
      throw ApiError.badRequest(
        err.response?.data?.message || 'Could not verify account. Check the account number and bank code.',
      );
    }
  }

  // ─── Bank Accounts ────────────────────────────────────────────────────────────

  async addBankAccount(
    userId: string,
    payload: { bankName: string; bankCode: string; accountNumber: string },
  ) {
    // 1. Verify account with Paystack
    const verified = await this.verifyAccountNumber(payload.accountNumber, payload.bankCode);

    // 2. Create Paystack transfer recipient
    let recipientCode: string;
    try {
      const res = await this.paystack.post('/transferrecipient', {
        type: 'nuban',
        name: verified.account_name,
        account_number: payload.accountNumber,
        bank_code: payload.bankCode,
        currency: 'NGN',
      });
      recipientCode = res.data.data.recipient_code;
    } catch (err: any) {
      throw ApiError.badGateway(
        err.response?.data?.message || 'Failed to register bank account with payment provider.',
      );
    }

    // 3. Check for duplicate recipient
    const duplicate = await this.payoutRepository.findBankAccountByRecipientCode(recipientCode);
    if (duplicate) {
      throw ApiError.conflict('This bank account is already registered.');
    }

    // 4. First account auto-defaults
    const count = await this.payoutRepository.countUserBankAccounts(userId);
    const isDefault = count === 0;

    const account = await this.payoutRepository.createBankAccount({
      userId,
      bankName: payload.bankName,
      bankCode: payload.bankCode,
      accountNumber: payload.accountNumber,
      accountName: verified.account_name,
      recipientCode,
      isDefault,
    });

    return account;
  }

  async listBankAccounts(userId: string) {
    return this.payoutRepository.findBankAccountsByUser(userId);
  }

  async setDefaultBankAccount(id: string, userId: string) {
    const account = await this.payoutRepository.findBankAccountById(id, userId);
    if (!account) throw ApiError.notFound('Bank account not found.');
    return this.payoutRepository.setDefaultBankAccount(id, userId);
  }

  async removeBankAccount(id: string, userId: string) {
    const account = await this.payoutRepository.findBankAccountById(id, userId);
    if (!account) throw ApiError.notFound('Bank account not found.');
    await this.payoutRepository.deactivateBankAccount(id, userId);
    return { message: 'Bank account removed.' };
  }

  // ─── Withdrawals ──────────────────────────────────────────────────────────────

  async initiateWithdrawal(
    userId: string,
    payload: {
      bankAccountId: string;
      amountUsd: number;
      pin: string;
      note?: string;
    },
  ) {
    // 1. Verify PIN
    await this.verifyPin(userId, payload.pin);

    // 2. Validate amount
    if (payload.amountUsd < MIN_WITHDRAWAL_USD) {
      throw ApiError.badRequest(`Minimum withdrawal is $${MIN_WITHDRAWAL_USD}.`);
    }

    // 3. Check wallet balance
    const wallet = await this.payoutRepository.getUserWalletBalance(userId);
    if (!wallet || wallet.walletBalance < payload.amountUsd) {
      throw ApiError.badRequest(
        `Insufficient wallet balance. Available: $${wallet?.walletBalance ?? 0}.`,
      );
    }

    // 4. Validate bank account belongs to user
    const bankAccount = await this.payoutRepository.findBankAccountById(
      payload.bankAccountId,
      userId,
    );
    if (!bankAccount) throw ApiError.notFound('Bank account not found.');

    // 5. Get NGN exchange rate
    const exchangeRate = await this.getNgnRate();
    const amountNgn = payload.amountUsd * exchangeRate;
    const amountKobo = Math.round(amountNgn * 100);

    // 6. Generate unique reference
    const reference = `WDR-${Date.now()}-${userId.slice(-6)}`;

    // 7. Deduct wallet balance (hold funds while processing)
    await this.payoutRepository.deductWalletBalance(userId, payload.amountUsd);

    // 8. Create withdrawal record
    const withdrawal = await this.payoutRepository.createWithdrawal({
      userId,
      bankAccountId: payload.bankAccountId,
      amountUsd: payload.amountUsd,
      amountNgn,
      exchangeRate,
      reference,
      note: payload.note,
    });

    // 9. Initiate Paystack transfer
    try {
      const res = await this.paystack.post('/transfer', {
        source: 'balance',
        amount: amountKobo,
        recipient: bankAccount.recipientCode,
        reason: payload.note || 'Seller withdrawal',
        reference,
        currency: 'NGN',
      });

      const transferData = res.data.data;

      await this.payoutRepository.updateWithdrawalByReference(reference, {
        status: WithdrawalStatus.PROCESSING,
        paystackTransferCode: transferData.transfer_code,
        paystackTransferId: String(transferData.id),
      });

      return {
        message: 'Withdrawal initiated. Funds will be credited to your bank account shortly.',
        reference,
        amountUsd: payload.amountUsd,
        amountNgn,
        exchangeRate,
        bankAccount: {
          bankName: bankAccount.bankName,
          accountNumber: bankAccount.accountNumber,
          accountName: bankAccount.accountName,
        },
        status: 'PROCESSING',
      };
    } catch (err: any) {
      // Rollback wallet balance if Paystack call fails
      await this.payoutRepository.restoreWalletBalance(userId, payload.amountUsd);
      await this.payoutRepository.updateWithdrawalByReference(reference, {
        status: WithdrawalStatus.FAILED,
        failureReason: err.response?.data?.message || 'Paystack transfer initiation failed.',
      });
      throw ApiError.badGateway(
        err.response?.data?.message || 'Could not initiate transfer. Please try again.',
      );
    }
  }

  async getWithdrawalHistory(userId: string, page: number, limit: number) {
    return this.payoutRepository.findUserWithdrawals(userId, page, limit);
  }

  async getWalletBalance(userId: string) {
    const wallet = await this.payoutRepository.getUserWalletBalance(userId);
    if (!wallet) throw ApiError.notFound('User not found.');
    const rate = await this.getNgnRate();
    return {
      walletBalance: wallet.walletBalance,
      currency: 'USD',
      equivalentNgn: +(wallet.walletBalance * rate).toFixed(2),
      exchangeRate: rate,
      pinSet: wallet.payoutPinSet,
    };
  }

  // ─── Webhook ──────────────────────────────────────────────────────────────────

  async handleTransferWebhook(event: string, data: any) {
    const reference: string = data?.reference;
    if (!reference) return;

    const withdrawal = await this.payoutRepository.findWithdrawalByReference(reference);
    if (!withdrawal) return; // Not our transfer

    if (event === 'transfer.success') {
      await this.payoutRepository.updateWithdrawalByReference(reference, {
        status: WithdrawalStatus.COMPLETED,
        processedAt: new Date(),
      });
    } else if (event === 'transfer.failed') {
      await this.payoutRepository.updateWithdrawalByReference(reference, {
        status: WithdrawalStatus.FAILED,
        failureReason: data?.reason || 'Transfer failed',
        processedAt: new Date(),
      });
      // Restore wallet
      await this.payoutRepository.restoreWalletBalance(withdrawal.userId, withdrawal.amountUsd);
    } else if (event === 'transfer.reversed') {
      await this.payoutRepository.updateWithdrawalByReference(reference, {
        status: WithdrawalStatus.REVERSED,
        failureReason: 'Transfer reversed by payment provider',
        processedAt: new Date(),
      });
      // Restore wallet
      await this.payoutRepository.restoreWalletBalance(withdrawal.userId, withdrawal.amountUsd);
    }
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────────

  private async getNgnRate(): Promise<number> {
    try {
      const res = await axios.get('https://api.exchangerate-api.com/v4/latest/USD', {
        timeout: 8_000,
      });
      return res.data?.rates?.NGN ?? 1550;
    } catch {
      return 1550; // fallback rate
    }
  }
}
