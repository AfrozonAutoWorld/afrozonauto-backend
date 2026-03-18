"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PayoutService = void 0;
const axios_1 = __importDefault(require("axios"));
const bcrypt = __importStar(require("bcrypt"));
const inversify_1 = require("inversify");
const types_1 = require("../config/types");
const PayoutRepository_1 = require("../repositories/PayoutRepository");
const ApiError_1 = require("../utils/ApiError");
const enums_1 = require("../generated/prisma/enums");
const secrets_1 = require("../secrets");
const MIN_WITHDRAWAL_USD = 10;
let PayoutService = class PayoutService {
    constructor(payoutRepository) {
        this.payoutRepository = payoutRepository;
        const secretKey = secrets_1.PAYSTACK_SECRET_KEY || '';
        this.paystack = axios_1.default.create({
            baseURL: 'https://api.paystack.co',
            headers: {
                Authorization: `Bearer ${secretKey}`,
                'Content-Type': 'application/json',
            },
            timeout: 30000,
        });
    }
    // ─── PIN Management ───────────────────────────────────────────────────────────
    setupPin(userId, pin) {
        return __awaiter(this, void 0, void 0, function* () {
            this.validatePinFormat(pin);
            const existing = yield this.payoutRepository.getUserPayoutPin(userId);
            if (existing === null || existing === void 0 ? void 0 : existing.payoutPinSet) {
                throw ApiError_1.ApiError.conflict('Payout PIN already set. Use change-pin to update it.');
            }
            const hashed = yield bcrypt.hash(pin, 10);
            yield this.payoutRepository.setPayoutPin(userId, hashed);
            return { message: 'Payout PIN set successfully.' };
        });
    }
    changePin(userId, oldPin, newPin) {
        return __awaiter(this, void 0, void 0, function* () {
            this.validatePinFormat(newPin);
            const record = yield this.payoutRepository.getUserPayoutPin(userId);
            if (!(record === null || record === void 0 ? void 0 : record.payoutPinSet) || !record.payoutPin) {
                throw ApiError_1.ApiError.badRequest('No payout PIN set. Use setup-pin first.');
            }
            const match = yield bcrypt.compare(oldPin, record.payoutPin);
            if (!match)
                throw ApiError_1.ApiError.forbidden('Current PIN is incorrect.');
            const hashed = yield bcrypt.hash(newPin, 10);
            yield this.payoutRepository.setPayoutPin(userId, hashed);
            return { message: 'Payout PIN updated successfully.' };
        });
    }
    verifyPin(userId, pin) {
        return __awaiter(this, void 0, void 0, function* () {
            const record = yield this.payoutRepository.getUserPayoutPin(userId);
            if (!(record === null || record === void 0 ? void 0 : record.payoutPinSet) || !record.payoutPin) {
                throw ApiError_1.ApiError.badRequest('Payout PIN not set. Please set a PIN before withdrawing.');
            }
            const match = yield bcrypt.compare(pin, record.payoutPin);
            if (!match)
                throw ApiError_1.ApiError.forbidden('Invalid payout PIN.');
        });
    }
    validatePinFormat(pin) {
        if (!/^\d{4,6}$/.test(pin)) {
            throw ApiError_1.ApiError.validationError('PIN must be 4–6 digits.');
        }
    }
    // ─── Banks ────────────────────────────────────────────────────────────────────
    listBanks() {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield this.paystack.get('/bank', {
                params: { country: 'nigeria', use_cursor: false, perPage: 200 },
            });
            return res.data.data;
        });
    }
    verifyAccountNumber(accountNumber, bankCode) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                const res = yield this.paystack.get('/bank/resolve', {
                    params: { account_number: accountNumber, bank_code: bankCode },
                });
                return res.data.data;
            }
            catch (err) {
                throw ApiError_1.ApiError.badRequest(((_b = (_a = err.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.message) || 'Could not verify account. Check the account number and bank code.');
            }
        });
    }
    // ─── Bank Accounts ────────────────────────────────────────────────────────────
    addBankAccount(userId, payload) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            // 1. Verify account with Paystack
            const verified = yield this.verifyAccountNumber(payload.accountNumber, payload.bankCode);
            // 2. Create Paystack transfer recipient
            let recipientCode;
            try {
                const res = yield this.paystack.post('/transferrecipient', {
                    type: 'nuban',
                    name: verified.account_name,
                    account_number: payload.accountNumber,
                    bank_code: payload.bankCode,
                    currency: 'NGN',
                });
                recipientCode = res.data.data.recipient_code;
            }
            catch (err) {
                throw ApiError_1.ApiError.badGateway(((_b = (_a = err.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.message) || 'Failed to register bank account with payment provider.');
            }
            // 3. Check for duplicate recipient
            const duplicate = yield this.payoutRepository.findBankAccountByRecipientCode(recipientCode);
            if (duplicate) {
                throw ApiError_1.ApiError.conflict('This bank account is already registered.');
            }
            // 4. First account auto-defaults
            const count = yield this.payoutRepository.countUserBankAccounts(userId);
            const isDefault = count === 0;
            const account = yield this.payoutRepository.createBankAccount({
                userId,
                bankName: payload.bankName,
                bankCode: payload.bankCode,
                accountNumber: payload.accountNumber,
                accountName: verified.account_name,
                recipientCode,
                isDefault,
            });
            return account;
        });
    }
    listBankAccounts(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.payoutRepository.findBankAccountsByUser(userId);
        });
    }
    setDefaultBankAccount(id, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const account = yield this.payoutRepository.findBankAccountById(id, userId);
            if (!account)
                throw ApiError_1.ApiError.notFound('Bank account not found.');
            return this.payoutRepository.setDefaultBankAccount(id, userId);
        });
    }
    removeBankAccount(id, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const account = yield this.payoutRepository.findBankAccountById(id, userId);
            if (!account)
                throw ApiError_1.ApiError.notFound('Bank account not found.');
            yield this.payoutRepository.deactivateBankAccount(id, userId);
            return { message: 'Bank account removed.' };
        });
    }
    // ─── Withdrawals ──────────────────────────────────────────────────────────────
    initiateWithdrawal(userId, payload) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e;
            // 1. Verify PIN
            yield this.verifyPin(userId, payload.pin);
            // 2. Validate amount
            if (payload.amountUsd < MIN_WITHDRAWAL_USD) {
                throw ApiError_1.ApiError.badRequest(`Minimum withdrawal is $${MIN_WITHDRAWAL_USD}.`);
            }
            // 3. Check wallet balance
            const wallet = yield this.payoutRepository.getUserWalletBalance(userId);
            if (!wallet || wallet.walletBalance < payload.amountUsd) {
                throw ApiError_1.ApiError.badRequest(`Insufficient wallet balance. Available: $${(_a = wallet === null || wallet === void 0 ? void 0 : wallet.walletBalance) !== null && _a !== void 0 ? _a : 0}.`);
            }
            // 4. Validate bank account belongs to user
            const bankAccount = yield this.payoutRepository.findBankAccountById(payload.bankAccountId, userId);
            if (!bankAccount)
                throw ApiError_1.ApiError.notFound('Bank account not found.');
            // 5. Get NGN exchange rate
            const exchangeRate = yield this.getNgnRate();
            const amountNgn = payload.amountUsd * exchangeRate;
            const amountKobo = Math.round(amountNgn * 100);
            // 6. Generate unique reference
            const reference = `WDR-${Date.now()}-${userId.slice(-6)}`;
            // 7. Deduct wallet balance (hold funds while processing)
            yield this.payoutRepository.deductWalletBalance(userId, payload.amountUsd);
            // 8. Create withdrawal record
            const withdrawal = yield this.payoutRepository.createWithdrawal({
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
                const res = yield this.paystack.post('/transfer', {
                    source: 'balance',
                    amount: amountKobo,
                    recipient: bankAccount.recipientCode,
                    reason: payload.note || 'Seller withdrawal',
                    reference,
                    currency: 'NGN',
                });
                const transferData = res.data.data;
                yield this.payoutRepository.updateWithdrawalByReference(reference, {
                    status: enums_1.WithdrawalStatus.PROCESSING,
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
            }
            catch (err) {
                // Rollback wallet balance if Paystack call fails
                yield this.payoutRepository.restoreWalletBalance(userId, payload.amountUsd);
                yield this.payoutRepository.updateWithdrawalByReference(reference, {
                    status: enums_1.WithdrawalStatus.FAILED,
                    failureReason: ((_c = (_b = err.response) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c.message) || 'Paystack transfer initiation failed.',
                });
                throw ApiError_1.ApiError.badGateway(((_e = (_d = err.response) === null || _d === void 0 ? void 0 : _d.data) === null || _e === void 0 ? void 0 : _e.message) || 'Could not initiate transfer. Please try again.');
            }
        });
    }
    getWithdrawalHistory(userId, page, limit) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.payoutRepository.findUserWithdrawals(userId, page, limit);
        });
    }
    getWalletBalance(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const wallet = yield this.payoutRepository.getUserWalletBalance(userId);
            if (!wallet)
                throw ApiError_1.ApiError.notFound('User not found.');
            const rate = yield this.getNgnRate();
            return {
                walletBalance: wallet.walletBalance,
                currency: 'USD',
                equivalentNgn: +(wallet.walletBalance * rate).toFixed(2),
                exchangeRate: rate,
                pinSet: wallet.payoutPinSet,
            };
        });
    }
    // ─── Webhook ──────────────────────────────────────────────────────────────────
    handleTransferWebhook(event, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const reference = data === null || data === void 0 ? void 0 : data.reference;
            if (!reference)
                return;
            const withdrawal = yield this.payoutRepository.findWithdrawalByReference(reference);
            if (!withdrawal)
                return; // Not our transfer
            if (event === 'transfer.success') {
                yield this.payoutRepository.updateWithdrawalByReference(reference, {
                    status: enums_1.WithdrawalStatus.COMPLETED,
                    processedAt: new Date(),
                });
            }
            else if (event === 'transfer.failed') {
                yield this.payoutRepository.updateWithdrawalByReference(reference, {
                    status: enums_1.WithdrawalStatus.FAILED,
                    failureReason: (data === null || data === void 0 ? void 0 : data.reason) || 'Transfer failed',
                    processedAt: new Date(),
                });
                // Restore wallet
                yield this.payoutRepository.restoreWalletBalance(withdrawal.userId, withdrawal.amountUsd);
            }
            else if (event === 'transfer.reversed') {
                yield this.payoutRepository.updateWithdrawalByReference(reference, {
                    status: enums_1.WithdrawalStatus.REVERSED,
                    failureReason: 'Transfer reversed by payment provider',
                    processedAt: new Date(),
                });
                // Restore wallet
                yield this.payoutRepository.restoreWalletBalance(withdrawal.userId, withdrawal.amountUsd);
            }
        });
    }
    // ─── Helpers ──────────────────────────────────────────────────────────────────
    getNgnRate() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            try {
                const res = yield axios_1.default.get('https://api.exchangerate-api.com/v4/latest/USD', {
                    timeout: 8000,
                });
                return (_c = (_b = (_a = res.data) === null || _a === void 0 ? void 0 : _a.rates) === null || _b === void 0 ? void 0 : _b.NGN) !== null && _c !== void 0 ? _c : 1550;
            }
            catch (_d) {
                return 1550; // fallback rate
            }
        });
    }
};
exports.PayoutService = PayoutService;
exports.PayoutService = PayoutService = __decorate([
    (0, inversify_1.injectable)(),
    __param(0, (0, inversify_1.inject)(types_1.TYPES.PayoutRepository)),
    __metadata("design:paramtypes", [PayoutRepository_1.PayoutRepository])
], PayoutService);
