import Stripe from 'stripe';
import { injectable } from 'inversify';
import { IPaymentProvider } from '../validation/interfaces/IPaymentProvider';
import { STRIPE_API_KEY } from '../secrets';
import loggers from '../utils/loggers';

@injectable()
export class StripeProvider implements IPaymentProvider {
    private stripe: Stripe | null = null;
    private isConfigured: boolean = false;

    constructor() {
        if (STRIPE_API_KEY) {
            try {
                this.stripe = new Stripe(STRIPE_API_KEY, {
                    apiVersion: '2025-12-15.clover'
                });
                this.isConfigured = true;
                loggers.info('Stripe provider initialized');
            } catch (error) {
                loggers.error('Failed to initialize Stripe provider:', error);
                this.isConfigured = false;
            }
        } else {
            loggers.warn('STRIPE_API_KEY not configured. Stripe payments will be unavailable.');
            this.isConfigured = false;
        }
    }


    async initializePayment(data: any) {
        if (!this.isConfigured || !this.stripe) {
            throw new Error('Stripe is not configured. Please set STRIPE_API_KEY environment variable.');
        }

        const intent = await this.stripe.paymentIntents.create({
            amount: data.amount * 100,
            currency: data.currency || 'usd',
            metadata: data.metadata
        });

        return {
            clientSecret: intent.client_secret!,
            reference: data.reference
        };
    }

    async verifyPayment(reference: string) {
        if (!this.isConfigured || !this.stripe) {
            throw new Error('Stripe is not configured. Please set STRIPE_API_KEY environment variable.');
        }

        const intent = await this.stripe.paymentIntents.retrieve(reference);
      
        let receiptUrl: string | undefined;
      
        if (intent.latest_charge) {
          const charge =
            typeof intent.latest_charge === 'string'
              ? await this.stripe.charges.retrieve(intent.latest_charge)
              : intent.latest_charge;
      
          receiptUrl = charge.receipt_url ?? undefined;
        }
      
        return {
          success: intent.status === 'succeeded',
          providerTransactionId: intent.id,
          receiptUrl,
          raw: intent
        };
    }
      
}
