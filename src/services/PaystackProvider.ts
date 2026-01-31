import axios, { AxiosInstance } from 'axios';
import { IPaymentProvider } from '../validation/interfaces/IPaymentProvider';
import { ExchangeRateService } from './ExchangeRateService';
import { inject, injectable } from 'inversify';
import { TYPES } from '../config/types';
import { PricingConfigService } from './PricingConfigService';

@injectable()
export class PaystackProvider implements IPaymentProvider {
  private axiosInstance: AxiosInstance;
  private secretKey: string;

  constructor(
    @inject(TYPES.ExchangeRateService)
    private exchangeRateService: ExchangeRateService,
    @inject(TYPES.PricingConfigService)
    private pricingConfigService: PricingConfigService,
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
      console.log('Paystack initializePayment received:', data);
  
      // Get exchange rate
      const exchangeRate = await this.exchangeRateService.getUsdToNgnRate();
      // Calculate TOTAL USD (vehicle + all fees)
      const pricing = await this.pricingConfigService.calculateTotalUsd(
        data.amount
      );
  
      const totalUsd = pricing.totalUsd;
  
      // Convert TOTAL USD → NGN (ONCE)
      const amountInNgn = totalUsd * exchangeRate;
  
      // Convert to kobo
      const amountInKobo = Math.round(amountInNgn * 100);
  
      if (amountInKobo < 100) {
        throw new Error('Amount must be at least 1 NGN');
      }
  

      const response = await this.axiosInstance.post(
        '/transaction/initialize',
        {
          email: data.email,
          amount: amountInKobo,
          currency: 'NGN',
          reference: data.reference,
          metadata: {
            ...data.metadata,
            pricing: pricing.breakdown,
            totalUsd,
            exchangeRate,
            totalNgn: amountInNgn
          },
          callback_url:
            data.metadata?.callbackUrl ||
            `${process.env.FRONTEND_URL}/payment/verify`
        }
      );
  
      return {
        authorizationUrl: response.data.data.authorization_url,
        accessCode: response.data.data.access_code,
        reference: data.reference,
        amountNgn: amountInNgn,
        pricing
      };
    } catch (error: any) {
      console.error('Paystack initialization error:', {
        message: error.message,
        response: error.response?.data
      });
  
      throw new Error(
        `Paystack payment initialization failed: ${
          error.response?.data?.message || error.message
        }`
      );
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
