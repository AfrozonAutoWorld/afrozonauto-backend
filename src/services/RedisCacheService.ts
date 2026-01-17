import { injectable } from 'inversify';
import Redis from 'ioredis';
import loggers from '../utils/loggers';
import { REDIS_CACHE_TTL_HOURS, REDIS_URL } from '../secrets';

@injectable()
export class RedisCacheService {
  private client: Redis | null = null;
  private readonly defaultTTL: number;
  private isDisabled: boolean = false;
  private keepAliveInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.defaultTTL = REDIS_CACHE_TTL_HOURS ? parseInt(REDIS_CACHE_TTL_HOURS, 10) * 3600 : 12 * 3600;
  
    if (REDIS_URL) {
      try {
        loggers.info('Initializing ioredis client');
        
        this.client = new Redis(REDIS_URL, {
          retryStrategy: (times) => {
            // Exponential backoff with max delay of 5 seconds
            const delay = Math.min(times * 100, 5000);
            return delay;
          },
          maxRetriesPerRequest: null, // Allow unlimited retries for connection issues
          enableReadyCheck: true,
          lazyConnect: false,
          connectTimeout: 10000,
          keepAlive: 30000, // Send keepalive packets every 30 seconds
          family: 4, // Force IPv4
          enableOfflineQueue: true, // Queue commands when offline
          enableAutoPipelining: false, // Disable auto-pipelining to avoid issues
        });

        // Set up event handlers
        this.client.on('connect', () => {
          loggers.info('Redis client connected');
        });

        this.client.on('ready', async () => {
          loggers.info('Redis client ready');
          // Test connection once ready
          await this.testConnection();
          // Start keepalive ping interval
          this.startKeepAlive();
        });

        this.client.on('error', (error: any) => {
          // Don't disable on connection errors - let it retry
          // Only log errors, don't disable unless it's a fatal error
          if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
            loggers.warn('Redis connection error (will retry):', error.message);
          } else if (error.code === 'ECONNRESET') {
            loggers.warn('Redis connection reset (will reconnect):', error.message);
          } else {
            loggers.error('Redis client error:', error);
          }
        });

        this.client.on('close', () => {
          loggers.warn('Redis connection closed');
          this.stopKeepAlive();
        });

        this.client.on('reconnecting', (delay: number) => {
          loggers.info(`Redis reconnecting in ${delay}ms`);
        });

        this.client.on('end', () => {
          loggers.warn('Redis connection ended');
          this.stopKeepAlive();
        });
      } catch (error) {
        loggers.error('Failed to initialize Redis client:', error);
        this.isDisabled = true;
      }
    } else {
      loggers.warn('REDIS_URL not configured, caching disabled');
      this.isDisabled = true;
    }
  }

  /**
   * Start periodic keepalive pings to prevent connection timeout
   */
  private startKeepAlive(): void {
    this.stopKeepAlive(); // Clear any existing interval
    
    // Ping every 20 seconds to keep connection alive
    this.keepAliveInterval = setInterval(async () => {
      if (this.client && this.client.status === 'ready') {
        try {
          await this.client.ping();
        } catch (error) {
          loggers.warn('Keepalive ping failed:', error);
        }
      }
    }, 20000); // 20 seconds
  }

  /**
   * Stop keepalive interval
   */
  private stopKeepAlive(): void {
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
      this.keepAliveInterval = null;
    }
  }

  /**
   * Test Redis connection
   */
  private async testConnection(): Promise<void> {
    try {
      if (this.client && this.client.status === 'ready') {
        const result = await this.client.ping();
        if (result === 'PONG') {
          loggers.info('Redis connection test successful');
        } else {
          loggers.warn('Redis ping returned unexpected result:', result);
        }
      } else {
        loggers.warn('Redis client not ready for connection test');
      }
    } catch (error) {
      loggers.error('Redis connection test failed:', error);
      // Don't disable on test failure - let it retry
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
    if (this.isDisabled || !this.client) {
      return false;
    }

    try {
      const result = await this.client.del(key);
      return result > 0;
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
   * ioredis accepts: mset('key1', 'value1', 'key2', 'value2')
   */
  async mset(keyValuePairs: Record<string, any>): Promise<boolean> {
    if (this.isDisabled || !this.client) {
      return false;
    }

    try {
      // Serialize all values and flatten to array [key1, value1, key2, value2, ...]
      const args: string[] = [];
      Object.entries(keyValuePairs).forEach(([key, value]) => {
        args.push(key);
        args.push(typeof value === 'string' ? value : JSON.stringify(value));
      });
      
      await this.client.mset(...args);
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
      
      // NX = Only set if key doesn't exist, EX = set expiry
      const result = await this.client.set(key, serialized, 'EX', ttl, 'NX');
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

  /**
   * Cleanup and disconnect Redis client
   */
  async disconnect(): Promise<void> {
    this.stopKeepAlive();
    if (this.client) {
      try {
        await this.client.quit();
        loggers.info('Redis client disconnected gracefully');
      } catch (error) {
        loggers.error('Error disconnecting Redis client:', error);
        this.client.disconnect();
      }
      this.client = null;
    }
  }
}