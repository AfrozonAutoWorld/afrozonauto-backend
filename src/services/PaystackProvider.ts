import axios from 'axios';
import { injectable } from 'inversify';
import { IPaymentProvider } from '../validation/interfaces/IPaymentProvider';


@injectable()
export class PaystackProvider implements IPaymentProvider {

  async initializePayment(data: any) {
    const response = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      {
        email: data.email,
        amount: data.amount * 100,
        reference: data.reference,
        metadata: data.metadata
      },
      { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET}` } }
    );

    return {
      authorizationUrl: response.data.data.authorization_url,
      reference: data.reference
    };
  }

  async verifyPayment(reference: string) {
    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET}` } }
    );

    return {
      success: response.data.data.status === 'success',
      providerTransactionId: response.data.data.id,
      receiptUrl: response.data.data.receipt_url,
      raw: response.data.data
    };
  }
}
