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
const inversify_1 = require("inversify");
let PaystackProvider = class PaystackProvider {
    constructor() {
        // Get secret key from environment variable
        this.secretKey = process.env.PAYSTACK_SECRET_KEY || '';
        this.exchangeRate = 1500;
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
            var _a, _b, _c, _d, _e, _f, _g;
            try {
                console.log('Paystack initializePayment received:', data);
                // FORCE NGN for Paystack - they don't support USD
                // If amount is in USD, convert to NGN
                let amountInNgn;
                if (data.currency === 'USD' || data.currency === undefined) {
                    // Convert USD to NGN
                    amountInNgn = data.amount * this.exchangeRate;
                    console.log(`Converting ${data.amount} USD to ${amountInNgn} NGN (rate: ${this.exchangeRate})`);
                }
                else if (data.currency === 'NGN') {
                    // Already in NGN
                    amountInNgn = data.amount;
                }
                else {
                    throw new Error(`Unsupported currency for Paystack: ${data.currency}. Only NGN is supported.`);
                }
                // Paystack expects amount in kobo (1 NGN = 100 kobo)
                const amountInKobo = Math.round(amountInNgn * 100);
                // Validate minimum amount (at least 100 kobo = 1 NGN)
                if (amountInKobo < 100) {
                    throw new Error('Amount must be at least 1 NGN (100 kobo)');
                }
                console.log('Sending to Paystack:', {
                    email: data.email,
                    amount: amountInKobo,
                    currency: 'NGN', // ALWAYS USE NGN
                    reference: data.reference,
                    metadata: Object.assign(Object.assign({}, data.metadata), { originalCurrency: data.currency || 'USD', originalAmount: data.amount, exchangeRate: this.exchangeRate, convertedAmountNgn: amountInNgn })
                });
                const response = yield this.axiosInstance.post('/transaction/initialize', {
                    email: data.email,
                    amount: amountInKobo,
                    reference: data.reference,
                    currency: 'NGN', // CRITICAL: Always use NGN for Paystack
                    metadata: Object.assign(Object.assign({}, data.metadata), { originalCurrency: data.currency || 'USD', originalAmount: data.amount, exchangeRate: this.exchangeRate, convertedAmountNgn: amountInNgn }),
                    callback_url: data.callbackUrl || `${process.env.FRONTEND_URL}/payment/verify`
                });
                console.log('Paystack response:', response.data);
                return {
                    authorizationUrl: response.data.data.authorization_url,
                    reference: data.reference,
                    accessCode: response.data.data.access_code
                };
            }
            catch (error) {
                console.error('Paystack initialization error:', {
                    message: error.message,
                    response: (_a = error.response) === null || _a === void 0 ? void 0 : _a.data,
                    status: (_b = error.response) === null || _b === void 0 ? void 0 : _b.status,
                    config: {
                        url: (_c = error.config) === null || _c === void 0 ? void 0 : _c.url,
                        data: (_d = error.config) === null || _d === void 0 ? void 0 : _d.data,
                        headers: (_e = error.config) === null || _e === void 0 ? void 0 : _e.headers
                    }
                });
                throw new Error(`Paystack payment initialization failed: ${((_g = (_f = error.response) === null || _f === void 0 ? void 0 : _f.data) === null || _g === void 0 ? void 0 : _g.message) || error.message}`);
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
    __metadata("design:paramtypes", [])
], PaystackProvider);
