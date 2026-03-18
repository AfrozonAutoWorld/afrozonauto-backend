"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
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
exports.PayoutRepository = void 0;
const inversify_1 = require("inversify");
const db_1 = __importDefault(require("../db"));
let PayoutRepository = class PayoutRepository {
    // ─── Bank Accounts ───────────────────────────────────────────────────────────
    createBankAccount(data) {
        return __awaiter(this, void 0, void 0, function* () {
            // If this is the first account or marked as default, ensure only one default
            if (data.isDefault) {
                yield db_1.default.bankAccount.updateMany({
                    where: { userId: data.userId, isDefault: true },
                    data: { isDefault: false },
                });
            }
            return db_1.default.bankAccount.create({ data });
        });
    }
    findBankAccountsByUser(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return db_1.default.bankAccount.findMany({
                where: { userId, isActive: true },
                orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
            });
        });
    }
    findBankAccountById(id, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return db_1.default.bankAccount.findFirst({
                where: { id, userId, isActive: true },
            });
        });
    }
    findBankAccountByRecipientCode(recipientCode) {
        return __awaiter(this, void 0, void 0, function* () {
            return db_1.default.bankAccount.findUnique({ where: { recipientCode } });
        });
    }
    setDefaultBankAccount(id, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield db_1.default.bankAccount.updateMany({
                where: { userId, isDefault: true },
                data: { isDefault: false },
            });
            return db_1.default.bankAccount.update({
                where: { id },
                data: { isDefault: true },
            });
        });
    }
    deactivateBankAccount(id, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return db_1.default.bankAccount.updateMany({
                where: { id, userId },
                data: { isActive: false },
            });
        });
    }
    countUserBankAccounts(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return db_1.default.bankAccount.count({ where: { userId, isActive: true } });
        });
    }
    // ─── Withdrawal Requests ──────────────────────────────────────────────────────
    createWithdrawal(data) {
        return __awaiter(this, void 0, void 0, function* () {
            return db_1.default.withdrawalRequest.create({ data });
        });
    }
    findWithdrawalByReference(reference) {
        return __awaiter(this, void 0, void 0, function* () {
            return db_1.default.withdrawalRequest.findUnique({
                where: { reference },
                include: { bankAccount: true, user: { select: { id: true, email: true, fullName: true } } },
            });
        });
    }
    updateWithdrawalByReference(reference, data) {
        return __awaiter(this, void 0, void 0, function* () {
            return db_1.default.withdrawalRequest.update({ where: { reference }, data });
        });
    }
    findUserWithdrawals(userId_1) {
        return __awaiter(this, arguments, void 0, function* (userId, page = 1, limit = 20) {
            const skip = (page - 1) * limit;
            const [withdrawals, total] = yield Promise.all([
                db_1.default.withdrawalRequest.findMany({
                    where: { userId },
                    include: { bankAccount: { select: { bankName: true, accountNumber: true, accountName: true } } },
                    orderBy: { createdAt: 'desc' },
                    skip,
                    take: limit,
                }),
                db_1.default.withdrawalRequest.count({ where: { userId } }),
            ]);
            return { withdrawals, total, page, limit, pages: Math.ceil(total / limit) };
        });
    }
    // ─── User wallet ──────────────────────────────────────────────────────────────
    getUserWalletBalance(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield db_1.default.user.findUnique({
                where: { id: userId },
                select: { walletBalance: true, currency: true, payoutPinSet: true },
            });
            return user;
        });
    }
    deductWalletBalance(userId, amountUsd) {
        return __awaiter(this, void 0, void 0, function* () {
            return db_1.default.user.update({
                where: { id: userId },
                data: { walletBalance: { decrement: amountUsd } },
            });
        });
    }
    restoreWalletBalance(userId, amountUsd) {
        return __awaiter(this, void 0, void 0, function* () {
            return db_1.default.user.update({
                where: { id: userId },
                data: { walletBalance: { increment: amountUsd } },
            });
        });
    }
    // ─── Payout PIN ───────────────────────────────────────────────────────────────
    setPayoutPin(userId, hashedPin) {
        return __awaiter(this, void 0, void 0, function* () {
            return db_1.default.user.update({
                where: { id: userId },
                data: { payoutPin: hashedPin, payoutPinSet: true },
            });
        });
    }
    getUserPayoutPin(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            return db_1.default.user.findUnique({
                where: { id: userId },
                select: { payoutPin: true, payoutPinSet: true },
            });
        });
    }
};
exports.PayoutRepository = PayoutRepository;
exports.PayoutRepository = PayoutRepository = __decorate([
    (0, inversify_1.injectable)()
], PayoutRepository);
