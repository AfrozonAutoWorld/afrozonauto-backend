"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stripeConfig = void 0;
const secrets_1 = require("../secrets");
exports.stripeConfig = {
    secretKey: secrets_1.STRIPE_API_KEY,
    webhookSecret: secrets_1.STRIPE_WEBHOOK_SECRET,
    apiVersion: '2024-12-18.acacia',
    // Payout configuration
    payout: {
        // Minimum payout amount in dollars
        minAmount: 10,
        // Maximum payout amount in dollars
        maxAmount: 100000,
        // Default currency
        defaultCurrency: 'usd',
        // Payout method: 'standard' (5-7 business days) or 'instant' (30 minutes, higher fees)
        defaultMethod: 'standard',
        // Automatic payout threshold (process when vendor balance reaches this)
        autoPayoutThreshold: 100,
        // Automatic payout schedule: daily, weekly, monthly
        autoPayoutSchedule: 'weekly',
    },
    // Connect account settings
    connect: {
        type: 'express',
        capabilities: ['transfers'],
    },
};
