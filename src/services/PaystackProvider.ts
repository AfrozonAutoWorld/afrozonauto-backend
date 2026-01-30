import axios, { AxiosInstance } from 'axios';
import { IPaymentProvider } from '../validation/interfaces/IPaymentProvider';
import { ExchangeRateService } from './ExchangeRateService';
import { inject, injectable } from 'inversify';
import { TYPES } from '../config/types';

@injectable()
export class PaystackProvider implements IPaymentProvider {
  private axiosInstance: AxiosInstance;
  private secretKey: string;

  constructor(
    @inject(TYPES.ExchangeRateService)
    private exchangeRateService: ExchangeRateService,
  ) {
    // Get secret key from environment variable
    this.secretKey = process.env.PAYSTACK_SECRET_KEY || '';

    if (!this.secretKey) {
      console.error('PAYSTACK_SECRET_KEY is not set in environment variables');
    }

    this.axiosInstance = axios.create({
      baseURL: 'https://api.paystack.co',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.secretKey}`
      },
      timeout: 30000 // 30 seconds timeout
    });
  }


  async initializePayment(data: any) {
    try {
      console.log('Paystack initializePayment received: ', data);
      // FORCE NGN for Paystack - they don't support USD
      // If amount is in USD, convert to NGN
      let amountInNgn: number;

      let exchangeRate = await this.exchangeRateService.getUsdToNgnRate();

      if (data.currency === 'USD' || !data.currency) {
        amountInNgn = data.amount * exchangeRate;

        console.log(`Converting ${data.amount} USD to ${amountInNgn} NGN (rate: ${exchangeRate})`);
      } else if (data.currency === 'NGN') {
        // Already in NGN
        amountInNgn = data.amount;
      } else {
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
        metadata: {
          ...data.metadata,
          originalCurrency: data.currency || 'USD',
          originalAmount: data.amount,
          exchangeRate: exchangeRate,
          convertedAmountNgn: amountInNgn
        }
      });

      const response = await this.axiosInstance.post('/transaction/initialize', {
        email: data.email,
        amount: amountInKobo,
        reference: data.reference,
        currency: 'NGN', // CRITICAL: Always use NGN for Paystack
        metadata: {
          ...data.metadata,
          originalCurrency: data.currency || 'USD',
          originalAmount: data.amount,
          exchangeRate: exchangeRate,
          convertedAmountNgn: amountInNgn
        },
        callback_url: data.metadata.callbackUrl || `${process.env.FRONTEND_URL}/payment/verify`
      });


      return {
        authorizationUrl: response.data.data.authorization_url,
        reference: data.reference,
        accessCode: response.data.data.access_code
      };
    } catch (error: any) {
      console.error('Paystack initialization error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: {
          url: error.config?.url,
          data: error.config?.data,
          headers: error.config?.headers
        }
      });
      throw new Error(`Paystack payment initialization failed: ${error.response?.data?.message || error.message}`);
    }
  }
  async verifyPayment(reference: string) {
    const response = await this.axiosInstance.get(`/transaction/verify/${reference}`);
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
  }
}
