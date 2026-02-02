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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentController = void 0;
const inversify_1 = require("inversify");
const types_1 = require("../config/types");
const asyncHandler_1 = require("../utils/asyncHandler");
const PaymentService_1 = require("../services/PaymentService");
const ApiError_1 = require("../utils/ApiError");
const ApiResponse_1 = require("../utils/ApiResponse");
const OrderService_1 = require("../services/OrderService");
let PaymentController = class PaymentController {
    constructor(paymentService, orderServices) {
        this.paymentService = paymentService;
        this.orderServices = orderServices;
        this.initPayment = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            if (!req.user) {
                return res.status(403).json(ApiError_1.ApiError.unauthorized('User not authenticated'));
            }
            const order = yield this.orderServices.getOrderById(req.body.orderId);
            if (!order) {
                return res.status(404).json(ApiError_1.ApiError.notFound("Order not found"));
            }
            if (!order.vehicleSnapshot) {
                return res.status(400).json(ApiError_1.ApiError.badRequest("Order is missing vehicle snapshot data"));
            }
            // Type guard to ensure it's an object
            const vehicleSnapshot = order.vehicleSnapshot;
            // if (typeof vehicleSnapshot.originalPriceUsd !== 'number') {
            //     return res.status(400).json(
            //         ApiError.badRequest("Invalid vehicle snapshot data")
            //     );
            // }
            console.log("============payments-=============");
            console.log(req.body);
            const result = yield this.paymentService.initiatePayment({
                orderId: req.body.orderId,
                userId: req.user.id,
                email: req.user.email,
                // amountUsd: 1000 || (vehicleSnapshot.originalPriceUsd ?? vehicleSnapshot.priceUsd) as number,
                amountUsd: 1000,
                provider: req.body.provider,
                paymentType: req.body.paymentType,
                currency: vehicleSnapshot.currency || 'USD',
                callbackUrl: req.body.callbackUrl,
                shippingMethod: order.shippingMethod
            });
            return res.status(200).json(ApiResponse_1.ApiResponse.success(result));
        }));
        this.verifyPayment = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            if (!req.user) {
                return res.status(403).json(ApiError_1.ApiError.unauthorized('User not authenticated'));
            }
            const { reference } = req.params;
            const { provider } = req.query;
            if (!reference) {
                return res.status(400).json(ApiError_1.ApiError.badRequest('Payment reference is required'));
            }
            if (!provider || (provider !== 'paystack' && provider !== 'stripe')) {
                return res.status(400).json(ApiError_1.ApiError.badRequest('Valid payment provider is required (paystack or stripe)'));
            }
            const result = yield this.paymentService.verifyPayment(reference, provider);
            return res.status(200).json(ApiResponse_1.ApiResponse.success(result, 'Payment verification completed'));
        }));
        this.paystackWebhook = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const reference = req.body.data.reference;
            yield this.paymentService.handlePaymentSuccess(reference, 'paystack');
            return res.status(200).json(ApiResponse_1.ApiResponse.success({}));
        }));
        this.stripeWebhook = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const reference = req.body.data.object.metadata.reference;
            const payment = yield this.paymentService.handlePaymentSuccess(reference, 'stripe');
            return res.status(200).json(ApiResponse_1.ApiResponse.success(payment));
        }));
        this.getAllPayments = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const payments = yield this.paymentService.getPayments();
            return res.status(200).json(ApiResponse_1.ApiResponse.success(payments));
        }));
        this.getAllUserPayments = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            if (!req.user) {
                return res.status(401).json(ApiError_1.ApiError.unauthorized('User not authenticated'));
            }
            const userId = req.user.id;
            const payments = yield this.paymentService.getUserPayments(userId);
            return res.status(200).json(ApiResponse_1.ApiResponse.success(payments));
        }));
        this.getPaymentById = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(this, void 0, void 0, function* () {
            const id = req.params.id;
            const payment = yield this.paymentService.getPaymentById(id);
            return res.status(200).json(ApiResponse_1.ApiResponse.success(payment));
        }));
    }
};
exports.PaymentController = PaymentController;
exports.PaymentController = PaymentController = __decorate([
    (0, inversify_1.injectable)(),
    __param(0, (0, inversify_1.inject)(types_1.TYPES.PaymentService)),
    __param(1, (0, inversify_1.inject)(types_1.TYPES.OrderService)),
    __metadata("design:paramtypes", [PaymentService_1.PaymentService,
        OrderService_1.OrderService])
], PaymentController);
