import Stripe from 'stripe';
import { inject, injectable } from 'inversify';
import { IPaymentProvider } from '../validation/interfaces/IPaymentProvider';
import { STRIPE_API_KEY } from '../secrets';
import loggers from '../utils/loggers';
import { TYPES } from '../config/types';
import { PricingConfigService } from './PricingConfigService';
import { ExchangeRateService } from './ExchangeRateService';
@injectable()
export class StripeProvider implements IPaymentProvider {
    private stripe: Stripe | null = null;
    private isConfigured: boolean = false;

    constructor(
        private exchangeRateService: ExchangeRateService,
        @inject(TYPES.PricingConfigService)
        private pricingConfigService: PricingConfigService,
    ) {
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


      // Get exchange rate
      const exchangeRate = await this.exchangeRateService.getUsdToNgnRate();
      

        const pricing = await this.pricingConfigService.calculateTotalUsd(
            data.amount,
            data?.metadata?.shippingMethod
        );

        const totalUsd = pricing.totalUsd;
        const calculation = await this.pricingConfigService.calculatePaymentAmount({
            totalAmountUsd: totalUsd,
            paymentType: data.metadata.paymentType
        });


      const amountPayable = calculation.paymentAmount

      // Convert TOTAL USD → NGN (ONCE)
      const amountInNgn = amountPayable * exchangeRate;
  

        const intent = await this.stripe.paymentIntents.create({
            // amount: data.amount * 100,
            amount: amountPayable * 100,
            currency: data.currency || 'usd',
            metadata: data.metadata,
            
        });

        return {
            clientSecret: intent.client_secret!,
            reference: data.reference,
            amountNgn: amountInNgn,
            pricing,
            accessCode: undefined,
            calculation
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
