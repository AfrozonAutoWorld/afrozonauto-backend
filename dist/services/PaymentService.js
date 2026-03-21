"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
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
exports.PaymentService = void 0;
const inversify_1 = require("inversify");
const PaymentRepository_1 = require("../repositories/PaymentRepository");
const OrderRepository_1 = require("../repositories/OrderRepository");
const types_1 = require("../config/types");
const db_1 = __importDefault(require("../db"));
const PricingConfigService_1 = require("./PricingConfigService");
const enums_1 = require("../generated/prisma/enums");
const NotificationService_1 = require("./NotificationService");
let PaymentService = class PaymentService {
    constructor(paymentRepo, orderRepo, pricingService, stripe, paystack, notificationService) {
        this.paymentRepo = paymentRepo;
        this.orderRepo = orderRepo;
        this.pricingService = pricingService;
        this.stripe = stripe;
        this.paystack = paystack;
        this.notificationService = notificationService;
        this.getPayments = () => {
            return this.paymentRepo.findAll();
        };
        this.getUserPayments = (userId) => {
            return this.paymentRepo.findAllUserPayments(userId);
        };
        this.getPaymentById = (id) => {
            return this.paymentRepo.findById(id);
        };
    }
    initiatePayment(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const reference = `AFZ-${Date.now()}`;
            const provider = payload.provider === 'stripe' ? this.stripe : this.paystack;
            const result = yield provider.initializePayment({
                amount: payload.amountUsd,
                currency: payload.currency,
                email: payload.email,
                reference,
                metadata: { orderId: payload.orderId, callbackUrl: payload.callbackUrl, shippingMethod: payload.shippingMethod, paymentType: payload.paymentType }
            });
            // Use the actual payable amount from provider calculation, fall back to raw amountUsd
            const payableAmount = (_b = (_a = result.calculation) === null || _a === void 0 ? void 0 : _a.paymentAmount) !== null && _b !== void 0 ? _b : payload.amountUsd;
            // Create payment record with calculation data if available
            const paymentData = {
                orderId: payload.orderId,
                userId: payload.userId,
                amountUsd: payableAmount,
                paymentType: payload.paymentType,
                paymentProvider: payload.provider,
                status: enums_1.PaymentStatus.PENDING,
                transactionRef: reference,
                localCurrency: payload.currency
            };
            // Add calculation metadata if available
            if (result.calculation) {
                paymentData.metadata = {
                    vehiclePriceUsd: payload.amountUsd,
                    calculation: result.calculation,
                    isDeposit: result.calculation.isDeposit,
                    depositPercentage: result.calculation.depositPercentage,
                    remainingBalance: result.calculation.remainingBalance
                };
            }
            yield this.paymentRepo.createPayment(paymentData);
            return Object.assign(Object.assign({}, result), paymentData.metadata);
        });
    }
    /**
     * Called from webhook
     */
    handlePaymentSuccess(reference, provider) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const payment = yield this.paymentRepo.findByReference(reference);
            if (!payment || payment.status === enums_1.PaymentStatus.COMPLETED)
                return;
            const providerClient = provider === 'stripe' ? this.stripe : this.paystack;
            const verification = yield providerClient.verifyPayment(reference);
            if (!verification.success)
                return;
            yield db_1.default.$transaction([
                this.paymentRepo.updatePaymentByRef(reference, {
                    status: enums_1.PaymentStatus.COMPLETED,
                    providerTransactionId: String(verification.providerTransactionId),
                    receiptUrl: (_a = verification.receiptUrl) !== null && _a !== void 0 ? _a : null,
                    completedAt: new Date(),
                    escrowStatus: 'HELD'
                }),
                this.orderRepo.updateOrderStatus(payment.orderId, payment.paymentType === enums_1.PaymentType.DEPOSIT
                    ? enums_1.OrderStatus.DEPOSIT_PAID
                    : enums_1.OrderStatus.BALANCE_PAID)
            ]);
            // Fire-and-forget admin notification
            this.notificationService.notifyAdminsPaymentReceived({
                orderId: payment.orderId,
                orderRef: payment.orderId,
                customerName: payment.userId,
                amountUsd: payment.amountUsd,
            }).catch(() => { });
        });
    }
    /**
    * Verify payment (frontend verification)
    */
    verifyPayment(reference, provider) {
        return __awaiter(this, void 0, void 0, function* () {
            // Get payment record
            const payment = yield this.paymentRepo.findByReference(reference);
            if (!payment) {
                throw new Error('Payment not found');
            }
            // If already completed, return current status
            if (payment.status === 'COMPLETED') {
                return {
                    success: true,
                    payment,
                    message: 'Payment already completed'
                };
            }
            // Get provider client
            const providerClient = provider === 'stripe' ? this.stripe : this.paystack;
            // Verify with provider
            const verification = yield providerClient.verifyPayment(reference);
            // Update payment based on verification
            if (verification.success) {
                // await this.handleSuccessfulVerification(payment, verification, provider);
                yield this.handlePaymentSuccess(reference, provider);
                return {
                    success: true,
                    payment: yield this.paymentRepo.findByReference(reference),
                    verification,
                    message: 'Payment verified successfully'
                };
            }
            else {
                yield this.paymentRepo.updatePayment(payment.id, {
                    status: 'FAILED',
                    metadata: {
                        failureReason: 'Verification failed',
                        provider: provider,
                        providerResponse: verification
                    }
                });
                return {
                    success: false,
                    payment: yield this.paymentRepo.findByReference(reference),
                    verification,
                    message: 'Payment verification failed'
                };
            }
        });
    }
    getAdminPayments(filters) {
        return __awaiter(this, void 0, void 0, function* () {
            const skip = (filters.page - 1) * filters.limit;
            const { payments, total } = yield this.paymentRepo.findAdminPaginated({ status: filters.status, search: filters.search }, { skip, take: filters.limit });
            return {
                payments,
                total,
                page: filters.page,
                limit: filters.limit,
                pages: Math.ceil(total / filters.limit),
            };
        });
    }
    getPaymentStats() {
        return this.paymentRepo.getStats();
    }
    // ─── Bank Transfer Evidence ───────────────────────────────────────────────
    uploadPaymentEvidence(orderId_1, userId_1, evidenceUrl_1, evidencePublicId_1) {
        return __awaiter(this, arguments, void 0, function* (orderId, userId, evidenceUrl, evidencePublicId, paymentType = 'DEPOSIT') {
            var _a, _b, _c;
            // Verify order belongs to user
            const order = yield this.orderRepo.findById(orderId);
            if (!order)
                throw Object.assign(new Error('Order not found'), { statusCode: 404 });
            if (order.userId !== userId)
                throw Object.assign(new Error('Access denied'), { statusCode: 403 });
            // Derive amount from paymentBreakdown (set at order creation via calculateTotalUsd)
            // Fall back to vehicleSnapshot price if breakdown is missing
            const breakdown = order.paymentBreakdown;
            const snapshot = order.vehicleSnapshot;
            const vehiclePriceUsd = ((_b = (_a = snapshot === null || snapshot === void 0 ? void 0 : snapshot.originalPriceUsd) !== null && _a !== void 0 ? _a : snapshot === null || snapshot === void 0 ? void 0 : snapshot.priceUsd) !== null && _b !== void 0 ? _b : 0);
            let amountUsd;
            if (breakdown === null || breakdown === void 0 ? void 0 : breakdown.totalUsd) {
                amountUsd = paymentType === 'FULL_PAYMENT'
                    ? breakdown.totalUsd
                    : ((_c = breakdown.totalUsedDeposit) !== null && _c !== void 0 ? _c : breakdown.totalUsd * 0.25);
            }
            else {
                // paymentBreakdown not yet set — use raw vehicle price as best estimate
                amountUsd = vehiclePriceUsd;
            }
            // Find existing open payment or create one now
            const payment = yield this.paymentRepo.findOrCreateBankTransferPayment(orderId, userId, paymentType, amountUsd);
            return this.paymentRepo.saveEvidence(payment.id, evidenceUrl, evidencePublicId);
        });
    }
    // ─── Admin Confirm / Reject ───────────────────────────────────────────────
    adminConfirmPayment(paymentId, adminId, note) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const payment = yield this.paymentRepo.findPaymentWithOrder(paymentId);
            if (!payment)
                throw Object.assign(new Error('Payment not found'), { statusCode: 404 });
            if (payment.status === enums_1.PaymentStatus.COMPLETED)
                throw Object.assign(new Error('Payment already confirmed'), { statusCode: 400 });
            const newOrderStatus = payment.paymentType === enums_1.PaymentType.DEPOSIT ? enums_1.OrderStatus.DEPOSIT_PAID : enums_1.OrderStatus.BALANCE_PAID;
            yield db_1.default.$transaction([
                this.paymentRepo.adminConfirmPayment(paymentId, adminId, note),
                this.orderRepo.updateOrderStatus(payment.orderId, newOrderStatus),
            ]);
            // Notify buyer
            this.notificationService.notifyAdminsPaymentReceived({
                orderId: payment.orderId,
                orderRef: payment.order.requestNumber,
                customerName: (_a = payment.user.fullName) !== null && _a !== void 0 ? _a : payment.user.email,
                amountUsd: payment.amountUsd,
            }).catch(() => { });
            return this.paymentRepo.findPaymentWithOrder(paymentId);
        });
    }
    adminRejectPayment(paymentId, adminId, note) {
        return __awaiter(this, void 0, void 0, function* () {
            const payment = yield this.paymentRepo.findPaymentWithOrder(paymentId);
            if (!payment)
                throw Object.assign(new Error('Payment not found'), { statusCode: 404 });
            if (!['PROCESSING', 'PENDING'].includes(payment.status)) {
                throw Object.assign(new Error('Only pending/processing payments can be rejected'), { statusCode: 400 });
            }
            return this.paymentRepo.adminRejectPayment(paymentId, adminId, note);
        });
    }
};
exports.PaymentService = PaymentService;
exports.PaymentService = PaymentService = __decorate([
    (0, inversify_1.injectable)(),
    __param(0, (0, inversify_1.inject)(types_1.TYPES.PaymentRepository)),
    __param(1, (0, inversify_1.inject)(types_1.TYPES.OrderRepository)),
    __param(2, (0, inversify_1.inject)(types_1.TYPES.PricingConfigService)),
    __param(3, (0, inversify_1.inject)(types_1.TYPES.StripeProvider)),
    __param(4, (0, inversify_1.inject)(types_1.TYPES.PaystackProvider)),
    __param(5, (0, inversify_1.inject)(types_1.TYPES.NotificationService)),
    __metadata("design:paramtypes", [PaymentRepository_1.PaymentRepository,
        OrderRepository_1.OrderRepository,
        PricingConfigService_1.PricingConfigService, Object, Object, NotificationService_1.NotificationService])
], PaymentService);
