import { injectable } from 'inversify';
import { Redis } from '@upstash/redis';
import loggers from '../utils/loggers';
import { UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN, REDIS_CACHE_TTL_HOURS } from '../secrets';

@injectable()
export class RedisCacheService {
  private client: Redis | null = null;
  private readonly defaultTTL: number;
  private isDisabled: boolean = false;

  constructor() {
    this.defaultTTL = REDIS_CACHE_TTL_HOURS ? parseInt(REDIS_CACHE_TTL_HOURS, 10) * 3600 : 12 * 3600; // Default 12 hours in seconds
    
    if (UPSTASH_REDIS_REST_URL && UPSTASH_REDIS_REST_TOKEN) {
      try {
        this.client = new Redis({
          url: UPSTASH_REDIS_REST_URL,
          token: UPSTASH_REDIS_REST_TOKEN,
        });
        loggers.info('Upstash Redis client initialized');
      } catch (error) {
        loggers.error('Failed to initialize Upstash Redis client:', error);
        this.isDisabled = true;
      }
    } else {
      loggers.warn('UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN not configured, caching disabled');
      this.isDisabled = true;
    }
  }

  /**
   * Disable Redis gracefully after repeated failures
   */
  private disableRedis(reason: string): void {
    if (!this.isDisabled) {
      this.isDisabled = true;
      loggers.warn(`Redis disabled: ${reason}. Caching will be unavailable.`);
      this.client = null;
    }
  }

  /**
   * Get cached value by key
   */
  async get<T>(key: string): Promise<T | null> {
    if (this.isDisabled || !this.client) {
      return null;
    }

    try {
      const value = await this.client.get(key);
      if (!value) {
        return null;
      }
      // Upstash Redis returns the value directly (already parsed if it was JSON)
      if (typeof value === 'string') {
        try {
          return JSON.parse(value) as T;
        } catch {
          return value as T;
        }
      }
      return value as T;
    } catch (error) {
      loggers.error(`Redis get error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set cached value with TTL
   */
  async set(key: string, value: any, ttlSeconds?: number): Promise<boolean> {
    if (this.isDisabled || !this.client) {
      return false;
    }

    try {
      const ttl = ttlSeconds || this.defaultTTL;
      const serialized = JSON.stringify(value);
      // Upstash Redis uses set with ex option for TTL
      await this.client.set(key, serialized, { ex: ttl });
      return true;
    } catch (error) {
      loggers.error(`Redis set error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Delete cached value
   */
  async delete(key: string): Promise<boolean> {
    if (this.isDisabled || !this.client) {
      return false;
    }

    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      loggers.error(`Redis delete error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Delete multiple keys by pattern
   */
  async deleteByPattern(pattern: string): Promise<number> {
    if (this.isDisabled || !this.client) {
      return 0;
    }

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length === 0) {
        return 0;
      }
      // Upstash Redis del can take multiple keys
      const result = await this.client.del(...keys);
      return typeof result === 'number' ? result : keys.length;
    } catch (error) {
      loggers.error(`Redis deleteByPattern error for pattern ${pattern}:`, error);
      return 0;
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    if (this.isDisabled || !this.client) {
      return false;
    }

    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      loggers.error(`Redis exists error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Get remaining TTL for a key
   */
  async getTTL(key: string): Promise<number> {
    if (this.isDisabled || !this.client) {
      return -1;
    }

    try {
      const ttl = await this.client.ttl(key);
      return ttl;
    } catch (error) {
      loggers.error(`Redis TTL error for key ${key}:`, error);
      return -1;
    }
  }

  /**
   * Check if Redis is connected (always true for Upstash REST API)
   */
  public isConnected(): boolean {
    return !this.isDisabled && this.client !== null;
  }

  /**
   * Generate cache key for vehicle listings
   */
  static getVehicleListingsKey(filters: any): string {
    const filterStr = JSON.stringify(filters);
    return `vehicle:listings:${Buffer.from(filterStr).toString('base64')}`;
  }

  /**
   * Generate cache key for vehicle by VIN
   */
  static getVehicleByVINKey(vin: string): string {
    return `vehicle:vin:${vin}`;
  }

  /**
   * Generate cache key for vehicle by ID
   */
  static getVehicleByIdKey(id: string): string {
    return `vehicle:id:${id}`;
  }
}

