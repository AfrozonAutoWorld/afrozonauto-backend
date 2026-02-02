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
exports.StripeProvider = void 0;
const stripe_1 = __importDefault(require("stripe"));
const inversify_1 = require("inversify");
const secrets_1 = require("../secrets");
const loggers_1 = __importDefault(require("../utils/loggers"));
const types_1 = require("../config/types");
const PricingConfigService_1 = require("./PricingConfigService");
const ExchangeRateService_1 = require("./ExchangeRateService");
let StripeProvider = class StripeProvider {
    constructor(exchangeRateService, pricingConfigService) {
        this.exchangeRateService = exchangeRateService;
        this.pricingConfigService = pricingConfigService;
        this.stripe = null;
        this.isConfigured = false;
        if (secrets_1.STRIPE_API_KEY) {
            try {
                this.stripe = new stripe_1.default(secrets_1.STRIPE_API_KEY, {
                    apiVersion: '2025-12-15.clover'
                });
                this.isConfigured = true;
                loggers_1.default.info('Stripe provider initialized');
            }
            catch (error) {
                loggers_1.default.error('Failed to initialize Stripe provider:', error);
                this.isConfigured = false;
            }
        }
        else {
            loggers_1.default.warn('STRIPE_API_KEY not configured. Stripe payments will be unavailable.');
            this.isConfigured = false;
        }
    }
    initializePayment(data) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            if (!this.isConfigured || !this.stripe) {
                throw new Error('Stripe is not configured. Please set STRIPE_API_KEY environment variable.');
            }
            // Get exchange rate
            const exchangeRate = yield this.exchangeRateService.getUsdToNgnRate();
            const pricing = yield this.pricingConfigService.calculateTotalUsd(data.amount, (_a = data === null || data === void 0 ? void 0 : data.metadata) === null || _a === void 0 ? void 0 : _a.shippingMethod);
            const totalUsd = pricing.totalUsd;
            const calculation = yield this.pricingConfigService.calculatePaymentAmount({
                totalAmountUsd: totalUsd,
                paymentType: data.metadata.paymentType
            });
            const amountPayable = calculation.paymentAmount;
            // Convert TOTAL USD → NGN (ONCE)
            const amountInNgn = amountPayable * exchangeRate;
            const intent = yield this.stripe.paymentIntents.create({
                // amount: data.amount * 100,
                amount: amountPayable * 100,
                currency: data.currency || 'usd',
                metadata: data.metadata,
            });
            return {
                clientSecret: intent.client_secret,
                reference: data.reference,
                amountNgn: amountInNgn,
                pricing,
                accessCode: undefined,
                calculation
            };
        });
    }
    verifyPayment(reference) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            if (!this.isConfigured || !this.stripe) {
                throw new Error('Stripe is not configured. Please set STRIPE_API_KEY environment variable.');
            }
            const intent = yield this.stripe.paymentIntents.retrieve(reference);
            let receiptUrl;
            if (intent.latest_charge) {
                const charge = typeof intent.latest_charge === 'string'
                    ? yield this.stripe.charges.retrieve(intent.latest_charge)
                    : intent.latest_charge;
                receiptUrl = (_a = charge.receipt_url) !== null && _a !== void 0 ? _a : undefined;
            }
            return {
                success: intent.status === 'succeeded',
                providerTransactionId: intent.id,
                receiptUrl,
                raw: intent
            };
        });
    }
};
exports.StripeProvider = StripeProvider;
exports.StripeProvider = StripeProvider = __decorate([
    (0, inversify_1.injectable)(),
    __param(1, (0, inversify_1.inject)(types_1.TYPES.PricingConfigService)),
    __metadata("design:paramtypes", [ExchangeRateService_1.ExchangeRateService,
        PricingConfigService_1.PricingConfigService])
], StripeProvider);
