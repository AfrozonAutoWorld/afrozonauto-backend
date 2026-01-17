"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisCacheService = void 0;
const inversify_1 = require("inversify");
const ioredis_1 = __importDefault(require("ioredis"));
const loggers_1 = __importDefault(require("../utils/loggers"));
const secrets_1 = require("../secrets");
let RedisCacheService = class RedisCacheService {
    constructor() {
        this.client = null;
        this.isDisabled = false;
        this.keepAliveInterval = null;
        this.defaultTTL = secrets_1.REDIS_CACHE_TTL_HOURS ? parseInt(secrets_1.REDIS_CACHE_TTL_HOURS, 10) * 3600 : 12 * 3600;
        if (secrets_1.REDIS_URL) {
            try {
                loggers_1.default.info('Initializing ioredis client');
                this.client = new ioredis_1.default(secrets_1.REDIS_URL, {
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
                    loggers_1.default.info('Redis client connected');
                });
                this.client.on('ready', () => __awaiter(this, void 0, void 0, function* () {
                    loggers_1.default.info('Redis client ready');
                    // Test connection once ready
                    yield this.testConnection();
                    // Start keepalive ping interval
                    this.startKeepAlive();
                }));
                this.client.on('error', (error) => {
                    // Don't disable on connection errors - let it retry
                    // Only log errors, don't disable unless it's a fatal error
                    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
                        loggers_1.default.warn('Redis connection error (will retry):', error.message);
                    }
                    else if (error.code === 'ECONNRESET') {
                        loggers_1.default.warn('Redis connection reset (will reconnect):', error.message);
                    }
                    else {
                        loggers_1.default.error('Redis client error:', error);
                    }
                });
                this.client.on('close', () => {
                    loggers_1.default.warn('Redis connection closed');
                    this.stopKeepAlive();
                });
                this.client.on('reconnecting', (delay) => {
                    loggers_1.default.info(`Redis reconnecting in ${delay}ms`);
                });
                this.client.on('end', () => {
                    loggers_1.default.warn('Redis connection ended');
                    this.stopKeepAlive();
                });
            }
            catch (error) {
                loggers_1.default.error('Failed to initialize Redis client:', error);
                this.isDisabled = true;
            }
        }
        else {
            loggers_1.default.warn('REDIS_URL not configured, caching disabled');
            this.isDisabled = true;
        }
    }
    /**
     * Start periodic keepalive pings to prevent connection timeout
     */
    startKeepAlive() {
        this.stopKeepAlive(); // Clear any existing interval
        // Ping every 20 seconds to keep connection alive
        this.keepAliveInterval = setInterval(() => __awaiter(this, void 0, void 0, function* () {
            if (this.client && this.client.status === 'ready') {
                try {
                    yield this.client.ping();
                }
                catch (error) {
                    loggers_1.default.warn('Keepalive ping failed:', error);
                }
            }
        }), 20000); // 20 seconds
    }
    /**
     * Stop keepalive interval
     */
    stopKeepAlive() {
        if (this.keepAliveInterval) {
            clearInterval(this.keepAliveInterval);
            this.keepAliveInterval = null;
        }
    }
    /**
     * Test Redis connection
     */
    testConnection() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (this.client && this.client.status === 'ready') {
                    const result = yield this.client.ping();
                    if (result === 'PONG') {
                        loggers_1.default.info('Redis connection test successful');
                    }
                    else {
                        loggers_1.default.warn('Redis ping returned unexpected result:', result);
                    }
                }
                else {
                    loggers_1.default.warn('Redis client not ready for connection test');
                }
            }
            catch (error) {
                loggers_1.default.error('Redis connection test failed:', error);
                // Don't disable on test failure - let it retry
            }
        });
    }
    /**
     * Disable Redis gracefully after repeated failures
     */
    disableRedis(reason) {
        if (!this.isDisabled) {
            this.isDisabled = true;
            loggers_1.default.warn(`Redis disabled: ${reason}. Caching will be unavailable.`);
            this.client = null;
        }
    }
    /**
     * Get cached value by key
     */
    get(key) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isDisabled || !this.client) {
                return null;
            }
            try {
                const value = yield this.client.get(key);
                if (value === null || value === undefined) {
                    return null;
                }
                // Try to parse JSON, otherwise return as-is
                try {
                    return typeof value === 'string' ? JSON.parse(value) : value;
                }
                catch (_a) {
                    return value;
                }
            }
            catch (error) {
                loggers_1.default.error(`Redis get error for key ${key}:`, error);
                return null;
            }
        });
    }
    /**
     * Set cached value with TTL
     */
    set(key, value, ttlSeconds) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isDisabled || !this.client) {
                return false;
            }
            try {
                const ttl = ttlSeconds || this.defaultTTL;
                const serialized = typeof value === 'string' ? value : JSON.stringify(value);
                yield this.client.setex(key, ttl, serialized);
                return true;
            }
            catch (error) {
                loggers_1.default.error(`Redis set error for key ${key}:`, error);
                return false;
            }
        });
    }
    /**
     * Delete cached value
     */
    delete(key) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isDisabled || !this.client) {
                return false;
            }
            try {
                const result = yield this.client.del(key);
                return result > 0;
            }
            catch (error) {
                loggers_1.default.error(`Redis delete error for key ${key}:`, error);
                return false;
            }
        });
    }
    /**
     * Delete multiple keys by pattern
     */
    deleteByPattern(pattern) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isDisabled || !this.client) {
                return 0;
            }
            try {
                const keys = yield this.client.keys(pattern);
                if (keys.length === 0) {
                    return 0;
                }
                const result = yield this.client.del(...keys);
                return result;
            }
            catch (error) {
                loggers_1.default.error(`Redis deleteByPattern error for pattern ${pattern}:`, error);
                return 0;
            }
        });
    }
    /**
     * Check if key exists
     */
    exists(key) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isDisabled || !this.client) {
                return false;
            }
            try {
                const result = yield this.client.exists(key);
                return result === 1;
            }
            catch (error) {
                loggers_1.default.error(`Redis exists error for key ${key}:`, error);
                return false;
            }
        });
    }
    /**
     * Get remaining TTL for a key
     */
    getTTL(key) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isDisabled || !this.client) {
                return -1;
            }
            try {
                return yield this.client.ttl(key);
            }
            catch (error) {
                loggers_1.default.error(`Redis TTL error for key ${key}:`, error);
                return -1;
            }
        });
    }
    /**
     * Check if Redis is connected
     */
    isConnected() {
        return !this.isDisabled && this.client !== null;
    }
    /**
     * Ping Redis to check connection
     */
    ping() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isDisabled || !this.client) {
                return false;
            }
            try {
                const result = yield this.client.ping();
                return result === 'PONG';
            }
            catch (error) {
                loggers_1.default.error('Redis ping error:', error);
                return false;
            }
        });
    }
    /**
     * Generate cache key for vehicle listings
     */
    static getVehicleListingsKey(filters) {
        const filterStr = JSON.stringify(filters);
        return `vehicle:listings:${Buffer.from(filterStr).toString('base64')}`;
    }
    /**
     * Generate cache key for vehicle by VIN
     */
    static getVehicleByVINKey(vin) {
        return `vehicle:vin:${vin}`;
    }
    /**
     * Generate cache key for vehicle by ID
     */
    static getVehicleByIdKey(id) {
        return `vehicle:id:${id}`;
    }
    /**
     * Flush all keys (use with caution)
     */
    flushAll() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isDisabled || !this.client) {
                return false;
            }
            try {
                yield this.client.flushdb();
                loggers_1.default.info('Redis cache flushed');
                return true;
            }
            catch (error) {
                loggers_1.default.error('Redis flushAll error:', error);
                return false;
            }
        });
    }
    /**
     * Get multiple keys at once
     */
    mget(keys) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isDisabled || !this.client || keys.length === 0) {
                return [];
            }
            try {
                const values = yield this.client.mget(...keys);
                return values.map(v => {
                    if (v === null || v === undefined)
                        return null;
                    try {
                        return typeof v === 'string' ? JSON.parse(v) : v;
                    }
                    catch (_a) {
                        return v;
                    }
                });
            }
            catch (error) {
                loggers_1.default.error('Redis mget error:', error);
                return keys.map(() => null);
            }
        });
    }
    /**
     * Set multiple keys at once
     * ioredis accepts: mset('key1', 'value1', 'key2', 'value2')
     */
    mset(keyValuePairs) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isDisabled || !this.client) {
                return false;
            }
            try {
                // Serialize all values and flatten to array [key1, value1, key2, value2, ...]
                const args = [];
                Object.entries(keyValuePairs).forEach(([key, value]) => {
                    args.push(key);
                    args.push(typeof value === 'string' ? value : JSON.stringify(value));
                });
                yield this.client.mset(...args);
                return true;
            }
            catch (error) {
                loggers_1.default.error('Redis mset error:', error);
                return false;
            }
        });
    }
    /**
     * Increment a counter
     */
    increment(key_1) {
        return __awaiter(this, arguments, void 0, function* (key, by = 1) {
            if (this.isDisabled || !this.client) {
                return 0;
            }
            try {
                if (by === 1) {
                    return yield this.client.incr(key);
                }
                else {
                    return yield this.client.incrby(key, by);
                }
            }
            catch (error) {
                loggers_1.default.error(`Redis increment error for key ${key}:`, error);
                return 0;
            }
        });
    }
    /**
     * Decrement a counter
     */
    decrement(key_1) {
        return __awaiter(this, arguments, void 0, function* (key, by = 1) {
            if (this.isDisabled || !this.client) {
                return 0;
            }
            try {
                if (by === 1) {
                    return yield this.client.decr(key);
                }
                else {
                    return yield this.client.decrby(key, by);
                }
            }
            catch (error) {
                loggers_1.default.error(`Redis decrement error for key ${key}:`, error);
                return 0;
            }
        });
    }
    /**
     * Set key with expiry only if it doesn't exist (NX option)
     */
    setnx(key, value, ttlSeconds) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isDisabled || !this.client) {
                return false;
            }
            try {
                const ttl = ttlSeconds || this.defaultTTL;
                const serialized = typeof value === 'string' ? value : JSON.stringify(value);
                // NX = Only set if key doesn't exist, EX = set expiry
                const result = yield this.client.set(key, serialized, 'EX', ttl, 'NX');
                return result === 'OK';
            }
            catch (error) {
                loggers_1.default.error(`Redis setnx error for key ${key}:`, error);
                return false;
            }
        });
    }
    /**
     * Get all keys matching pattern
     */
    keys(pattern) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isDisabled || !this.client) {
                return [];
            }
            try {
                return yield this.client.keys(pattern);
            }
            catch (error) {
                loggers_1.default.error(`Redis keys error for pattern ${pattern}:`, error);
                return [];
            }
        });
    }
    /**
     * Cleanup and disconnect Redis client
     */
    disconnect() {
        return __awaiter(this, void 0, void 0, function* () {
            this.stopKeepAlive();
            if (this.client) {
                try {
                    yield this.client.quit();
                    loggers_1.default.info('Redis client disconnected gracefully');
                }
                catch (error) {
                    loggers_1.default.error('Error disconnecting Redis client:', error);
                    this.client.disconnect();
                }
                this.client = null;
            }
        });
    }
};
exports.RedisCacheService = RedisCacheService;
exports.RedisCacheService = RedisCacheService = __decorate([
    (0, inversify_1.injectable)(),
    __metadata("design:paramtypes", [])
], RedisCacheService);
