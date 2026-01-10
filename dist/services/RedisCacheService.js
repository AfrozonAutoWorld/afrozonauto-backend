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
        this.defaultTTL = secrets_1.REDIS_CACHE_TTL_HOURS ? parseInt(secrets_1.REDIS_CACHE_TTL_HOURS, 10) * 3600 : 12 * 3600; // Default 12 hours in seconds
        if (secrets_1.REDIS_URL) {
            try {
                this.client = new ioredis_1.default(secrets_1.REDIS_URL, {
                    retryStrategy: (times) => {
                        const delay = Math.min(times * 50, 2000);
                        return delay;
                    },
                    maxRetriesPerRequest: 3,
                    enableReadyCheck: true,
                    lazyConnect: true,
                });
                this.client.on('connect', () => {
                    loggers_1.default.info('Redis client connecting...');
                });
                this.client.on('ready', () => {
                    loggers_1.default.info('Redis client ready');
                });
                this.client.on('error', (err) => {
                    loggers_1.default.error('Redis client error:', err);
                });
                this.client.on('close', () => {
                    loggers_1.default.warn('Redis client connection closed');
                });
                // Connect lazily
                this.client.connect().catch((err) => {
                    loggers_1.default.error('Failed to connect to Redis:', err);
                });
            }
            catch (error) {
                loggers_1.default.error('Failed to initialize Redis client:', error);
            }
        }
        else {
            loggers_1.default.warn('REDIS_URL not configured, caching disabled');
        }
    }
    /**
     * Get cached value by key
     */
    get(key) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.client || !this.isConnected()) {
                return null;
            }
            try {
                const value = yield this.client.get(key);
                if (!value) {
                    return null;
                }
                return JSON.parse(value);
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
            if (!this.client || !this.isConnected()) {
                return false;
            }
            try {
                const ttl = ttlSeconds || this.defaultTTL;
                const serialized = JSON.stringify(value);
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
            if (!this.client || !this.isConnected()) {
                return false;
            }
            try {
                yield this.client.del(key);
                return true;
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
            if (!this.client || !this.isConnected()) {
                return 0;
            }
            try {
                const keys = yield this.client.keys(pattern);
                if (keys.length === 0) {
                    return 0;
                }
                return yield this.client.del(...keys);
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
            if (!this.client || !this.isConnected()) {
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
            if (!this.client || !this.isConnected()) {
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
        var _a;
        return ((_a = this.client) === null || _a === void 0 ? void 0 : _a.status) === 'ready';
    }
    /**
     * Close Redis connection
     */
    disconnect() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.client) {
                yield this.client.quit();
                this.client = null;
                loggers_1.default.info('Redis client disconnected');
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
};
exports.RedisCacheService = RedisCacheService;
exports.RedisCacheService = RedisCacheService = __decorate([
    (0, inversify_1.injectable)(),
    __metadata("design:paramtypes", [])
], RedisCacheService);
