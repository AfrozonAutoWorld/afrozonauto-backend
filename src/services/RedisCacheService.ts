import { injectable } from 'inversify';
import { Redis } from '@upstash/redis';
import loggers from '../utils/loggers';
import { REDIS_CACHE_TTL_HOURS, UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN } from '../secrets';

@injectable()
export class RedisCacheService {
  private client: Redis | null = null;
  private readonly defaultTTL: number;
  private isDisabled: boolean = false;

  constructor() {
    this.defaultTTL = REDIS_CACHE_TTL_HOURS ? parseInt(REDIS_CACHE_TTL_HOURS, 10) * 3600 : 12 * 3600;
  
    if (UPSTASH_REDIS_REST_URL && UPSTASH_REDIS_REST_TOKEN) {
      try {
        loggers.info('Initializing Upstash Redis client');
        
        this.client = new Redis({
          url: UPSTASH_REDIS_REST_URL,
          token: UPSTASH_REDIS_REST_TOKEN,
        });

        // Test the connection
        this.testConnection();
      } catch (error) {
        loggers.error('Failed to initialize Upstash Redis client:', error);
        this.isDisabled = true;
      }
    } else {
      loggers.warn('Upstash Redis credentials not provided. Caching will be disabled.');
      this.isDisabled = true;
    }
  }

  /**
   * Test Redis connection
   */
  private async testConnection(): Promise<void> {
    try {
      await this.client?.ping();
      loggers.info('Upstash Redis connection successful');
    } catch (error) {
      loggers.error('Upstash Redis connection test failed:', error);
      this.disableRedis('Connection test failed');
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
      if (value === null || value === undefined) {
        return null;
      }
      
      // Try to parse JSON, otherwise return as-is
      try {
        return typeof value === 'string' ? JSON.parse(value) : value as T;
      } catch {
        return value as T;
      }
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
      const serialized = typeof value === 'string' ? value : JSON.stringify(value);
      
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
      const result = await this.client.del(...keys);
      return result;
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
      return await this.client.ttl(key);
    } catch (error) {
      loggers.error(`Redis TTL error for key ${key}:`, error);
      return -1;
    }
  }

  /**
   * Check if Redis is connected
   */
  public isConnected(): boolean {
    return !this.isDisabled && this.client !== null;
  }

  /**
   * Ping Redis to check connection
   */
  async ping(): Promise<boolean> {
    if (this.isDisabled || !this.client) {
      return false;
    }

    try {
      const result = await this.client.ping();
      return result === 'PONG';
    } catch (error) {
      loggers.error('Redis ping error:', error);
      return false;
    }
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

  /**
   * Flush all keys (use with caution)
   */
  async flushAll(): Promise<boolean> {
    if (this.isDisabled || !this.client) {
      return false;
    }

    try {
      await this.client.flushdb();
      loggers.info('Redis cache flushed');
      return true;
    } catch (error) {
      loggers.error('Redis flushAll error:', error);
      return false;
    }
  }

  /**
   * Get multiple keys at once
   */
  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    if (this.isDisabled || !this.client || keys.length === 0) {
      return [];
    }

    try {
      const values = await this.client.mget(...keys);
      return values.map(v => {
        if (v === null || v === undefined) return null;
        try {
          return typeof v === 'string' ? JSON.parse(v) : v as T;
        } catch {
          return v as T;
        }
      });
    } catch (error) {
      loggers.error('Redis mget error:', error);
      return keys.map(() => null);
    }
  }

  /**
   * Set multiple keys at once
   * Upstash Redis accepts: mset({ key1: 'value1', key2: 'value2' })
   */
  async mset(keyValuePairs: Record<string, any>): Promise<boolean> {
    if (this.isDisabled || !this.client) {
      return false;
    }

    try {
      // Serialize all values
      const serializedPairs: Record<string, string> = {};
      Object.entries(keyValuePairs).forEach(([key, value]) => {
        serializedPairs[key] = typeof value === 'string' ? value : JSON.stringify(value);
      });
      
      // Pass as a single object
      await this.client.mset(serializedPairs);
      return true;
    } catch (error) {
      loggers.error('Redis mset error:', error);
      return false;
    }
  }

  /**
   * Increment a counter
   */
  async increment(key: string, by: number = 1): Promise<number> {
    if (this.isDisabled || !this.client) {
      return 0;
    }

    try {
      if (by === 1) {
        return await this.client.incr(key);
      } else {
        return await this.client.incrby(key, by);
      }
    } catch (error) {
      loggers.error(`Redis increment error for key ${key}:`, error);
      return 0;
    }
  }

  /**
   * Decrement a counter
   */
  async decrement(key: string, by: number = 1): Promise<number> {
    if (this.isDisabled || !this.client) {
      return 0;
    }

    try {
      if (by === 1) {
        return await this.client.decr(key);
      } else {
        return await this.client.decrby(key, by);
      }
    } catch (error) {
      loggers.error(`Redis decrement error for key ${key}:`, error);
      return 0;
    }
  }

  /**
   * Set key with expiry only if it doesn't exist (NX option)
   */
  async setnx(key: string, value: any, ttlSeconds?: number): Promise<boolean> {
    if (this.isDisabled || !this.client) {
      return false;
    }

    try {
      const ttl = ttlSeconds || this.defaultTTL;
      const serialized = typeof value === 'string' ? value : JSON.stringify(value);
      
      // NX = Only set if key doesn't exist
      const result = await this.client.set(key, serialized, { ex: ttl, nx: true });
      return result === 'OK';
    } catch (error) {
      loggers.error(`Redis setnx error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Get all keys matching pattern
   */
  async keys(pattern: string): Promise<string[]> {
    if (this.isDisabled || !this.client) {
      return [];
    }

    try {
      return await this.client.keys(pattern);
    } catch (error) {
      loggers.error(`Redis keys error for pattern ${pattern}:`, error);
      return [];
    }
  }
}