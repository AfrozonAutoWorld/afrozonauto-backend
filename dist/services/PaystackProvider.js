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
exports.PaystackProvider = void 0;
const axios_1 = __importDefault(require("axios"));
const ExchangeRateService_1 = require("./ExchangeRateService");
const inversify_1 = require("inversify");
const types_1 = require("../config/types");
const PricingConfigService_1 = require("./PricingConfigService");
let PaystackProvider = class PaystackProvider {
    constructor(exchangeRateService, pricingConfigService) {
        this.exchangeRateService = exchangeRateService;
        this.pricingConfigService = pricingConfigService;
        // Get secret key from environment variable
        this.secretKey = process.env.PAYSTACK_SECRET_KEY || '';
        if (!this.secretKey) {
            console.error('PAYSTACK_SECRET_KEY is not set in environment variables');
        }
        this.axiosInstance = axios_1.default.create({
            baseURL: 'https://api.paystack.co',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.secretKey}`
            },
            timeout: 30000 // 30 seconds timeout
        });
    }
    initializePayment(data) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f;
            try {
                console.log('Paystack initializePayment received:', data);
                // Get exchange rate
                const exchangeRate = yield this.exchangeRateService.getUsdToNgnRate();
                // Calculate TOTAL USD (vehicle + all fees)
                const pricing = yield this.pricingConfigService.calculateTotalUsd(data.amount, (_a = data === null || data === void 0 ? void 0 : data.metadata) === null || _a === void 0 ? void 0 : _a.shippingMethod);
                const totalUsd = pricing.totalUsd;
                const calculation = yield this.pricingConfigService.calculatePaymentAmount({
                    totalAmountUsd: totalUsd,
                    paymentType: data.metadata.paymentType
                });
                const amountPayable = calculation.paymentAmount;
                // Convert TOTAL USD → NGN (ONCE)
                const amountInNgn = amountPayable * exchangeRate;
                // Convert to kobo
                const amountInKobo = Math.round(amountInNgn * 100);
                if (amountInKobo < 100) {
                    throw new Error('Amount must be at least 1 NGN');
                }
                const response = yield this.axiosInstance.post('/transaction/initialize', {
                    email: data.email,
                    amount: amountInKobo,
                    currency: 'NGN',
                    reference: data.reference,
                    metadata: Object.assign(Object.assign({}, data.metadata), { pricing: pricing.breakdown, totalUsd,
                        exchangeRate, totalNgn: amountInNgn, shippingMethod: (_b = data === null || data === void 0 ? void 0 : data.metadata) === null || _b === void 0 ? void 0 : _b.shippingMethod }),
                    callback_url: ((_c = data.metadata) === null || _c === void 0 ? void 0 : _c.callbackUrl) ||
                        `${process.env.FRONTEND_URL}/payment/verify`
                });
                return {
                    authorizationUrl: response.data.data.authorization_url,
                    accessCode: response.data.data.access_code,
                    reference: data.reference,
                    amountNgn: amountInNgn,
                    pricing,
                    calculation
                };
            }
            catch (error) {
                console.error('Paystack initialization error:', {
                    message: error.message,
                    response: (_d = error.response) === null || _d === void 0 ? void 0 : _d.data
                });
                throw new Error(`Paystack payment initialization failed: ${((_f = (_e = error.response) === null || _e === void 0 ? void 0 : _e.data) === null || _f === void 0 ? void 0 : _f.message) || error.message}`);
            }
        });
    }
    verifyPayment(reference) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this.axiosInstance.get(`/transaction/verify/${reference}`);
            const data = response.data.data;
            return {
                success: data.status === 'success',
                providerTransactionId: data.id,
                reference: data.reference,
                amount: data.amount / 100,
                currency: data.currency,
                customer: {
                    email: data.customer.email,
                    name: data.customer.name || data.customer.email
                },
                metadata: data.metadata,
                channel: data.channel,
                paidAt: data.paid_at ? new Date(data.paid_at) : new Date(),
                receiptUrl: response.data.data.receipt_url,
                raw: response.data.data
            };
        });
    }
};
exports.PaystackProvider = PaystackProvider;
exports.PaystackProvider = PaystackProvider = __decorate([
    (0, inversify_1.injectable)(),
    __param(0, (0, inversify_1.inject)(types_1.TYPES.ExchangeRateService)),
    __param(1, (0, inversify_1.inject)(types_1.TYPES.PricingConfigService)),
    __metadata("design:paramtypes", [ExchangeRateService_1.ExchangeRateService,
        PricingConfigService_1.PricingConfigService])
], PaystackProvider);
