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
let PaymentService = class PaymentService {
    constructor(paymentRepo, orderRepo, pricingService, stripe, paystack) {
        this.paymentRepo = paymentRepo;
        this.orderRepo = orderRepo;
        this.pricingService = pricingService;
        this.stripe = stripe;
        this.paystack = paystack;
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
            const reference = `AFZ-${Date.now()}`;
            const provider = payload.provider === 'stripe' ? this.stripe : this.paystack;
            const result = yield provider.initializePayment({
                amount: payload.amountUsd,
                currency: payload.currency,
                email: payload.email,
                reference,
                metadata: { orderId: payload.orderId, callbackUrl: payload.callbackUrl, shippingMethod: payload.shippingMethod, paymentType: payload.paymentType }
            });
            // Create payment record with calculation data if available
            const paymentData = {
                orderId: payload.orderId,
                userId: payload.userId,
                amountUsd: payload.amountUsd,
                paymentType: payload.paymentType,
                paymentProvider: payload.provider,
                status: enums_1.PaymentStatus.PENDING,
                transactionRef: reference,
                localCurrency: payload.currency
            };
            // Add calculation metadata if available
            if (result.calculation) {
                paymentData.metadata = {
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
            const payment = yield this.paymentRepo.findByReference(reference);
            if (!payment || payment.status === 'COMPLETED')
                return;
            const providerClient = provider === 'stripe' ? this.stripe : this.paystack;
            const verification = yield providerClient.verifyPayment(reference);
            if (!verification.success)
                return;
            yield db_1.default.$transaction([
                this.paymentRepo.updatePaymentByRef(reference, {
                    status: 'COMPLETED',
                    providerTransactionId: verification.providerTransactionId,
                    receiptUrl: verification.receiptUrl,
                    completedAt: new Date(),
                    escrowStatus: 'HELD'
                }),
                this.orderRepo.updateOrderStatus(payment.orderId, payment.paymentType === 'DEPOSIT'
                    ? 'DEPOSIT_PAID'
                    : 'PAID')
            ]);
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
};
exports.PaymentService = PaymentService;
exports.PaymentService = PaymentService = __decorate([
    (0, inversify_1.injectable)(),
    __param(0, (0, inversify_1.inject)(types_1.TYPES.PaymentRepository)),
    __param(1, (0, inversify_1.inject)(types_1.TYPES.OrderRepository)),
    __param(2, (0, inversify_1.inject)(types_1.TYPES.PricingConfigService)),
    __param(3, (0, inversify_1.inject)(types_1.TYPES.StripeProvider)),
    __param(4, (0, inversify_1.inject)(types_1.TYPES.PaystackProvider)),
    __metadata("design:paramtypes", [PaymentRepository_1.PaymentRepository,
        OrderRepository_1.OrderRepository,
        PricingConfigService_1.PricingConfigService, Object, Object])
], PaymentService);
