import { STRIPE_API_KEY, STRIPE_WEBHOOK_SECRET } from "../secrets";

export const stripeConfig = {
    secretKey: STRIPE_API_KEY!,
    webhookSecret: STRIPE_WEBHOOK_SECRET!,
    apiVersion: '2024-12-18.acacia' as any,

    // Payout configuration
    payout: {
        // Minimum payout amount in dollars
        minAmount: 10,

        // Maximum payout amount in dollars
        maxAmount: 100000,

        // Default currency
        defaultCurrency: 'usd',

        // Payout method: 'standard' (5-7 business days) or 'instant' (30 minutes, higher fees)
        defaultMethod: 'standard' as const,

        // Automatic payout threshold (process when vendor balance reaches this)
        autoPayoutThreshold: 100,

        // Automatic payout schedule: daily, weekly, monthly
        autoPayoutSchedule: 'weekly' as const,
    },

    // Connect account settings
    connect: {
        type: 'express' as const,
        capabilities: ['transfers'],
    },
};