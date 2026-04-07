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
const secrets_1 = require("../secrets");
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
    uploadPaymentEvidence(orderId_1, userId_1, evidenceUrls_1, evidencePublicIds_1) {
        return __awaiter(this, arguments, void 0, function* (orderId, userId, evidenceUrls, evidencePublicIds, paymentType = 'DEPOSIT', transferredAmountUsd) {
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
            return this.paymentRepo.saveEvidenceWithAmount(payment.id, evidenceUrls, evidencePublicIds, transferredAmountUsd);
        });
    }
    // ─── Admin Confirm / Reject ───────────────────────────────────────────────
    adminConfirmPayment(paymentId, adminId, status, note) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f;
            const payment = yield this.paymentRepo.findPaymentWithOrder(paymentId);
            if (!payment)
                throw Object.assign(new Error('Payment not found'), { statusCode: 404 });
            if (payment.status === status)
                throw Object.assign(new Error(`Payment is already ${status}`), { statusCode: 400 });
            let newOrderStatus = payment.paymentType === enums_1.PaymentType.DEPOSIT
                ? enums_1.OrderStatus.DEPOSIT_PAID
                : enums_1.OrderStatus.BALANCE_PAID;
            if (payment.paymentType === enums_1.PaymentType.DEPOSIT) {
                const breakdown = payment.order.paymentBreakdown;
                const totalUsd = breakdown === null || breakdown === void 0 ? void 0 : breakdown.totalUsd;
                const expectedDepositUsd = (_a = breakdown === null || breakdown === void 0 ? void 0 : breakdown.totalUsedDeposit) !== null && _a !== void 0 ? _a : (totalUsd ? totalUsd * Number(secrets_1.DEPOSIT_PERCENTAGE) : 0);
                if (expectedDepositUsd > 0) {
                    const completedDepositUsd = yield this.paymentRepo.getCompletedDepositTotalUsdForOrder(payment.orderId);
                    const totalConfirmedDepositUsd = completedDepositUsd + (payment.amountUsd || 0);
                    newOrderStatus =
                        totalConfirmedDepositUsd >= expectedDepositUsd
                            ? enums_1.OrderStatus.DEPOSIT_PAID
                            : enums_1.OrderStatus.HALF_DEPOSIT_PAID;
                }
            }
            const transactions = [];
            transactions.push(this.paymentRepo.adminUpdatePaymentStatus(paymentId, adminId, status, note));
            if (status === enums_1.PaymentStatus.COMPLETED) {
                transactions.push(this.orderRepo.updateOrderStatus(payment.orderId, newOrderStatus));
            }
            yield db_1.default.$transaction(transactions);
            // Notify admins (fails silently)
            if (status === enums_1.PaymentStatus.COMPLETED) {
                this.notificationService.notifyAdminsPaymentReceived({
                    orderId: payment.orderId,
                    orderRef: ((_b = payment.order) === null || _b === void 0 ? void 0 : _b.requestNumber) || 'UNKNOWN',
                    customerName: (_f = (_d = (_c = payment.user) === null || _c === void 0 ? void 0 : _c.fullName) !== null && _d !== void 0 ? _d : (_e = payment.user) === null || _e === void 0 ? void 0 : _e.email) !== null && _f !== void 0 ? _f : 'Unknown Customer',
                    amountUsd: payment.amountUsd,
                }).catch(() => { });
            }
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
    // ─── Admin Notify Seller ──────────────────────────────────────────────────
    notifySellerOfCompletePayment(paymentId) {
        return __awaiter(this, void 0, void 0, function* () {
            const payment = yield this.paymentRepo.findById(paymentId);
            if (!payment)
                throw Object.assign(new Error('Payment not found'), { statusCode: 404 });
            // Accept either status if business allows, but generally should be COMPLETED
            if (payment.status !== enums_1.PaymentStatus.COMPLETED) {
                throw Object.assign(new Error('Payment must be COMPLETED before notifying the seller'), { statusCode: 400 });
            }
            const order = yield db_1.default.order.findUnique({
                where: { id: payment.orderId },
                include: {
                    vehicle: {
                        include: {
                            user: true
                        }
                    }
                }
            });
            if (!order || !order.vehicle || !order.vehicle.userId || !order.vehicle.user) {
                throw Object.assign(new Error('Seller not found for this vehicle/order'), { statusCode: 404 });
            }
            if (payment.paymentType === enums_1.PaymentType.DEPOSIT && order.status !== enums_1.OrderStatus.BALANCE_PAID) {
                throw Object.assign(new Error('This payment is a deposit. Vehicle must be fully paid before notifying the seller.'), { statusCode: 400 });
            }
            const seller = order.vehicle.user;
            const vehicleName = `${order.vehicle.year} ${order.vehicle.make} ${order.vehicle.model}`;
            yield this.notificationService.notifySellerPaymentComplete({
                userId: seller.id,
                userEmail: seller.email,
                orderId: order.id,
                orderRef: order.requestNumber,
                amountUsd: payment.amountUsd,
                vehicleName
            });
            return { message: "Seller notified successfully via email and in-app notification" };
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
