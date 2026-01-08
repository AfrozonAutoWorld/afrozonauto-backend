import { injectable } from 'inversify';
import Redis from 'ioredis';
import loggers from '../utils/loggers';
import { REDIS_URL, REDIS_CACHE_TTL_HOURS } from '../secrets';

@injectable()
export class RedisCacheService {
  private client: Redis | null = null;
  private readonly defaultTTL: number;

  constructor() {
    this.defaultTTL = REDIS_CACHE_TTL_HOURS ? parseInt(REDIS_CACHE_TTL_HOURS, 10) * 3600 : 12 * 3600; // Default 12 hours in seconds
    
    if (REDIS_URL) {
      try {
        this.client = new Redis(REDIS_URL, {
          retryStrategy: (times) => {
            const delay = Math.min(times * 50, 2000);
            return delay;
          },
          maxRetriesPerRequest: 3,
          enableReadyCheck: true,
          lazyConnect: true,
        });

        this.client.on('connect', () => {
          loggers.info('Redis client connecting...');
        });

        this.client.on('ready', () => {
          loggers.info('Redis client ready');
        });

        this.client.on('error', (err) => {
          loggers.error('Redis client error:', err);
        });

        this.client.on('close', () => {
          loggers.warn('Redis client connection closed');
        });

        // Connect lazily
        this.client.connect().catch((err) => {
          loggers.error('Failed to connect to Redis:', err);
        });
      } catch (error) {
        loggers.error('Failed to initialize Redis client:', error);
      }
    } else {
      loggers.warn('REDIS_URL not configured, caching disabled');
    }
  }

  /**
   * Get cached value by key
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.client || !this.isConnected()) {
      return null;
    }

    try {
      const value = await this.client.get(key);
      if (!value) {
        return null;
      }
      return JSON.parse(value) as T;
    } catch (error) {
      loggers.error(`Redis get error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set cached value with TTL
   */
  async set(key: string, value: any, ttlSeconds?: number): Promise<boolean> {
    if (!this.client || !this.isConnected()) {
      return false;
    }

    try {
      const ttl = ttlSeconds || this.defaultTTL;
      const serialized = JSON.stringify(value);
      await this.client.setex(key, ttl, serialized);
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
    if (!this.client || !this.isConnected()) {
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
    if (!this.client || !this.isConnected()) {
      return 0;
    }

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length === 0) {
        return 0;
      }
      return await this.client.del(...keys);
    } catch (error) {
      loggers.error(`Redis deleteByPattern error for pattern ${pattern}:`, error);
      return 0;
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    if (!this.client || !this.isConnected()) {
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
    if (!this.client || !this.isConnected()) {
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
  private isConnected(): boolean {
    return this.client?.status === 'ready';
  }

  /**
   * Close Redis connection
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = null;
      loggers.info('Redis client disconnected');
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
}

