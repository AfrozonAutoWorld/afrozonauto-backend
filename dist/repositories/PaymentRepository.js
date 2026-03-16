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
exports.PaymentRepository = void 0;
const inversify_1 = require("inversify");
const db_1 = __importDefault(require("../db"));
const enums_1 = require("../generated/prisma/enums");
let PaymentRepository = class PaymentRepository {
    createPayment(data) {
        return db_1.default.payment.create({ data });
    }
    findAdminPaginated(filters, pagination) {
        return __awaiter(this, void 0, void 0, function* () {
            const where = {};
            if (filters.status) {
                where.status = filters.status;
            }
            if (filters.search) {
                where.OR = [
                    { transactionRef: { contains: filters.search, mode: 'insensitive' } },
                    { orderId: { contains: filters.search, mode: 'insensitive' } },
                ];
            }
            const [payments, total] = yield Promise.all([
                db_1.default.payment.findMany({
                    where,
                    include: { order: true, user: { select: { id: true, email: true, fullName: true, profile: { select: { firstName: true, lastName: true } } } } },
                    orderBy: { createdAt: 'desc' },
                    skip: pagination.skip,
                    take: pagination.take,
                }),
                db_1.default.payment.count({ where }),
            ]);
            return { payments, total };
        });
    }
    getStats() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const [totalTransactions, revenueAgg, pendingCount, refundedAgg] = yield Promise.all([
                db_1.default.payment.count(),
                db_1.default.payment.aggregate({
                    _sum: { amountUsd: true },
                    where: { status: enums_1.PaymentStatus.COMPLETED },
                }),
                db_1.default.payment.count({ where: { status: enums_1.PaymentStatus.PENDING } }),
                db_1.default.payment.aggregate({
                    _sum: { amountUsd: true },
                    where: { status: enums_1.PaymentStatus.REFUNDED },
                }),
            ]);
            return {
                totalTransactions,
                totalRevenue: (_a = revenueAgg._sum.amountUsd) !== null && _a !== void 0 ? _a : 0,
                pendingCount,
                totalRefunded: (_b = refundedAgg._sum.amountUsd) !== null && _b !== void 0 ? _b : 0,
            };
        });
    }
    updatePaymentByRef(reference, data) {
        return db_1.default.payment.update({
            where: { transactionRef: reference },
            data
        });
    }
    updatePayment(id, data) {
        return db_1.default.payment.update({
            where: { id },
            data
        });
    }
    findByReference(reference) {
        return db_1.default.payment.findFirst({
            where: { transactionRef: reference },
            include: { order: true }
        });
    }
    findById(id) {
        return db_1.default.payment.findFirst({
            where: { id },
            include: { order: true }
        });
    }
    findAll() {
        return db_1.default.payment.findMany({
            include: { order: true }
        });
    }
    findAllUserPayments(userId) {
        return db_1.default.payment.findMany({
            where: { userId },
            include: { order: true }
        });
    }
    updateByReference(transactionRef, data) {
        return db_1.default.payment.update({
            where: { transactionRef },
            data
        });
    }
};
exports.PaymentRepository = PaymentRepository;
exports.PaymentRepository = PaymentRepository = __decorate([
    (0, inversify_1.injectable)()
], PaymentRepository);
