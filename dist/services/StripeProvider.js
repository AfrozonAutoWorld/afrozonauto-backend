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
exports.StripeProvider = void 0;
const stripe_1 = __importDefault(require("stripe"));
const inversify_1 = require("inversify");
let StripeProvider = class StripeProvider {
    constructor() {
        this.stripe = new stripe_1.default(process.env.STRIPE_SECRET, {
            apiVersion: '2025-12-15.clover'
        });
    }
    initializePayment(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const intent = yield this.stripe.paymentIntents.create({
                amount: data.amount * 100,
                currency: data.currency,
                metadata: data.metadata
            });
            return {
                clientSecret: intent.client_secret,
                reference: data.reference
            };
        });
    }
    verifyPayment(reference) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
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
    (0, inversify_1.injectable)()
], StripeProvider);
