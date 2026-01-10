import Stripe from 'stripe';
import { injectable } from 'inversify';
import { IPaymentProvider } from '../validation/interfaces/IPaymentProvider';

@injectable()
export class StripeProvider implements IPaymentProvider {
    private stripe = new Stripe(process.env.STRIPE_SECRET!, {
        apiVersion: '2025-12-15.clover'
    });


    async initializePayment(data: any) {
        const intent = await this.stripe.paymentIntents.create({
            amount: data.amount * 100,
            currency: data.currency,
            metadata: data.metadata
        });

        return {
            clientSecret: intent.client_secret!,
            reference: data.reference
        };
    }
    async verifyPayment(reference: string) {
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
