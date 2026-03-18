import { Response } from 'express';
import { inject, injectable } from 'inversify';
import * as crypto from 'crypto';
import { TYPES } from '../config/types';
import { PayoutService } from '../services/PayoutService';
import { AuthenticatedRequest } from '../types/customRequest';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';

@injectable()
export class PayoutController {
  constructor(
    @inject(TYPES.PayoutService)
    private payoutService: PayoutService,
  ) {}

  // ─── PIN ─────────────────────────────────────────────────────────────────────

  setupPin = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const { pin } = req.body;
    const result = await this.payoutService.setupPin(userId, pin);
    return res.status(200).json({ success: true, ...result });
  });

  changePin = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const { oldPin, newPin } = req.body;
    const result = await this.payoutService.changePin(userId, oldPin, newPin);
    return res.status(200).json({ success: true, ...result });
  });

  // ─── Banks ────────────────────────────────────────────────────────────────────

  listBanks = asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
    const banks = await this.payoutService.listBanks();
    return res.status(200).json({ success: true, data: banks });
  });

  verifyAccount = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { accountNumber, bankCode } = req.body;
    if (!accountNumber || !bankCode) {
      throw ApiError.badRequest('accountNumber and bankCode are required.');
    }
    const result = await this.payoutService.verifyAccountNumber(accountNumber, bankCode);
    return res.status(200).json({ success: true, data: result });
  });

  // ─── Bank Accounts ────────────────────────────────────────────────────────────

  addBankAccount = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const { bankName, bankCode, accountNumber } = req.body;
    if (!bankName || !bankCode || !accountNumber) {
      throw ApiError.badRequest('bankName, bankCode, and accountNumber are required.');
    }
    const account = await this.payoutService.addBankAccount(userId, {
      bankName,
      bankCode,
      accountNumber,
    });
    return res.status(201).json({ success: true, data: account });
  });

  listBankAccounts = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const accounts = await this.payoutService.listBankAccounts(userId);
    return res.status(200).json({ success: true, data: accounts });
  });

  setDefaultBankAccount = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const { id } = req.params;
    const account = await this.payoutService.setDefaultBankAccount(id, userId);
    return res.status(200).json({ success: true, data: account });
  });

  removeBankAccount = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const { id } = req.params;
    const result = await this.payoutService.removeBankAccount(id, userId);
    return res.status(200).json({ success: true, ...result });
  });

  // ─── Withdrawals ──────────────────────────────────────────────────────────────

  initiateWithdrawal = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const { bankAccountId, amountUsd, pin, note } = req.body;

    if (!bankAccountId || !amountUsd || !pin) {
      throw ApiError.badRequest('bankAccountId, amountUsd, and pin are required.');
    }
    if (typeof amountUsd !== 'number' || amountUsd <= 0) {
      throw ApiError.badRequest('amountUsd must be a positive number.');
    }

    const result = await this.payoutService.initiateWithdrawal(userId, {
      bankAccountId,
      amountUsd,
      pin,
      note,
    });
    return res.status(200).json({ success: true, data: result });
  });

  getWithdrawalHistory = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, parseInt(req.query.limit as string) || 20);
    const result = await this.payoutService.getWithdrawalHistory(userId, page, limit);
    return res.status(200).json({ success: true, ...result });
  });

  getWalletBalance = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const data = await this.payoutService.getWalletBalance(userId);
    return res.status(200).json({ success: true, data });
  });

  // ─── Webhook ──────────────────────────────────────────────────────────────────

  paystackTransferWebhook = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const secret = process.env.PAYSTACK_WEBHOOK_SECRET_KEY || '';
    const signature = req.headers['x-paystack-signature'] as string;

    if (secret && signature) {
      const hash = crypto
        .createHmac('sha512', secret)
        .update(req.body) // raw Buffer
        .digest('hex');

      if (hash !== signature) {
        return res.status(401).json({ success: false, message: 'Invalid signature' });
      }
    }

    const payload = JSON.parse(req.body.toString());
    const { event, data } = payload;

    if (['transfer.success', 'transfer.failed', 'transfer.reversed'].includes(event)) {
      await this.payoutService.handleTransferWebhook(event, data);
    }

    return res.status(200).json({ success: true });
  });
}
