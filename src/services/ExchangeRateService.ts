import axios from 'axios';
import { injectable } from 'inversify';
import Redis from 'ioredis';
import {
  EXCHANGE_RATE_API_URL,
  REDIS_URL,
  EXCHANGE_RATE_CACHE_TTL
} from '../secrets';
import { ApiError } from '../utils/ApiError';

@injectable()
export class ExchangeRateService {
  private redis = new Redis(REDIS_URL);

  async getUsdToNgnRate(): Promise<number> {
    const cacheKey = 'exchange_rate:USD:NGN';

    // Try cache first
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return Number(cached);
    }

    // Fetch from API
    const response = await axios.get(EXCHANGE_RATE_API_URL);
    const rate = response.data.conversion_rates?.NGN;

    if (!rate) {
      throw ApiError.badGateway('NGN rate not found in exchange API');
    }

    // Cache using env TTL
    await this.redis.set(
      cacheKey,
      rate.toString(),
      'EX',
      EXCHANGE_RATE_CACHE_TTL
    );

    return rate;
  }
}
