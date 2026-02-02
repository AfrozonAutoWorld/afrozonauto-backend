"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
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
exports.ExchangeRateService = void 0;
const axios_1 = __importDefault(require("axios"));
const inversify_1 = require("inversify");
const ioredis_1 = __importDefault(require("ioredis"));
const secrets_1 = require("../secrets");
const ApiError_1 = require("../utils/ApiError");
let ExchangeRateService = class ExchangeRateService {
    constructor() {
        this.redis = new ioredis_1.default(secrets_1.REDIS_URL);
    }
    getUsdToNgnRate() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const cacheKey = 'exchange_rate:USD:NGN';
            // Try cache first
            const cached = yield this.redis.get(cacheKey);
            if (cached) {
                return Number(cached);
            }
            // Fetch from API
            const response = yield axios_1.default.get(secrets_1.EXCHANGE_RATE_API_URL);
            const rate = (_a = response.data.conversion_rates) === null || _a === void 0 ? void 0 : _a.NGN;
            if (!rate) {
                throw ApiError_1.ApiError.badGateway('NGN rate not found in exchange API');
            }
            // Cache using env TTL
            yield this.redis.set(cacheKey, rate.toString(), 'EX', secrets_1.EXCHANGE_RATE_CACHE_TTL);
            return rate;
        });
    }
};
exports.ExchangeRateService = ExchangeRateService;
exports.ExchangeRateService = ExchangeRateService = __decorate([
    (0, inversify_1.injectable)()
], ExchangeRateService);
