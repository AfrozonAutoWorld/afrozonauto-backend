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
exports.AutoDevService = void 0;
const inversify_1 = require("inversify");
const secrets_1 = require("../secrets");
const loggers_1 = __importDefault(require("../utils/loggers"));
const ApiError_1 = require("../utils/ApiError");
let AutoDevService = class AutoDevService {
    constructor() {
        this.baseUrl = secrets_1.AUTO_DEV_BASE_URL || 'https://api.auto.dev';
        this.apiKey = secrets_1.AUTO_DEV_API_KEY;
        this.makeModelsCache = null;
        this.makeModelsCacheTtlMs = 1000 * 60 * 60 * 24; // 24h
        /**
         * Fetch vehicle specifications
         */
        this.fetchSpecifications = (vin) => __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield fetch(`${this.baseUrl}/specs/${vin}`, {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json',
                    },
                });
                if (!response.ok) {
                    return null;
                }
                const data = yield response.json();
                return data.specs || null;
            }
            catch (error) {
                loggers_1.default.error('Auto.dev fetchSpecifications error:', error);
                return null;
            }
        });
    }
    /**
     * Fetch vehicle listings from Auto.dev
     */
    fetchListings(filters) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.apiKey) {
                loggers_1.default.warn('AUTO_DEV_API_KEY is not configured. Cannot fetch listings from Auto.dev API.');
                throw ApiError_1.ApiError.internal('Auto.dev API key is not configured');
            }
            try {
                const params = new URLSearchParams();
                if (filters.make)
                    params.append('vehicle.make', filters.make);
                if (filters.model)
                    params.append('vehicle.model', filters.model);
                if (filters.year)
                    params.append('vehicle.year', filters.year.toString());
                if (filters.zip)
                    params.append('zip', filters.zip);
                if (filters.distance)
                    params.append('distance', filters.distance.toString());
                if (filters.page)
                    params.append('page', filters.page.toString());
                if (filters.limit)
                    params.append('limit', filters.limit.toString());
                const response = yield fetch(`${this.baseUrl}/listings?${params}`, {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json',
                    },
                });
                if (!response.ok) {
                    const errorText = yield response.text();
                    loggers_1.default.error(`Auto.dev API error (${response.status}): ${response.statusText}`, {
                        status: response.status,
                        statusText: response.statusText,
                        body: errorText.substring(0, 200)
                    });
                    throw ApiError_1.ApiError.internal(`Auto.dev API error: ${response.statusText} (Status: ${response.status})`);
                }
                const data = yield response.json();
                if (data.error) {
                    loggers_1.default.error('Auto.dev API returned error:', data.error);
                    throw ApiError_1.ApiError.internal(data.error.message || 'Auto.dev API error');
                }
                return data.data || [];
            }
            catch (error) {
                loggers_1.default.error('Auto.dev fetchListings error:', error);
                throw error;
            }
        });
    }
    fetchListingsWithParams(params) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.apiKey) {
                loggers_1.default.warn('AUTO_DEV_API_KEY is not configured. Cannot fetch listings from Auto.dev API.');
                throw new Error('Auto.dev API key is not configured');
            }
            const searchParams = new URLSearchParams();
            const keys = [
                'vehicle.make', 'vehicle.model', 'vehicle.year', 'vehicle.bodyStyle', 'vehicle.fuel', 'vehicle.trim',
                'vehicle.transmission', 'vehicle.exteriorColor', 'vehicle.interiorColor',
                'retailListing.price', 'retailListing.miles', 'retailListing.state',
                'wholesaleListing.state', 'wholesaleListing.miles', 'wholesaleListing.buyNowPrice',
                'zip', 'page', 'limit', 'distance',
            ];
            for (const key of keys) {
                const v = params[key];
                if (v === undefined || v === null || v === '')
                    continue;
                if (key === 'distance' && typeof v === 'number') {
                    searchParams.append(key, String(v));
                }
                else if (key === 'page' || key === 'limit') {
                    if (typeof v === 'number')
                        searchParams.append(key, String(v));
                }
                else if (typeof v === 'string') {
                    searchParams.append(key, v);
                }
            }
            const url = `${this.baseUrl}/listings?${searchParams}`;
            try {
                const response = yield fetch(url, {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json',
                    },
                });
                if (!response.ok) {
                    const errorText = yield response.text();
                    loggers_1.default.error(`Auto.dev API error (${response.status}): ${response.statusText}`, {
                        status: response.status,
                        statusText: response.statusText,
                        body: errorText.substring(0, 200),
                    });
                    throw new Error(`Auto.dev API error: ${response.statusText} (Status: ${response.status})`);
                }
                const data = yield response.json();
                if (data.error) {
                    loggers_1.default.error('Auto.dev API returned error:', data.error);
                    throw new Error(data.error.message || 'Auto.dev API error');
                }
                return data.data || [];
            }
            catch (error) {
                loggers_1.default.error('Auto.dev fetchListingsWithParams error:', error);
                throw error;
            }
        });
    }
    /**
     * Reference: fetch makes -> models mapping from Auto.dev
     * Docs: GET /api/models
     */
    fetchMakeModelsReference() {
        return __awaiter(this, arguments, void 0, function* (forceRefresh = false) {
            var _a, _b, _c, _d, _e, _f, _g;
            if (!this.apiKey) {
                loggers_1.default.warn('AUTO_DEV_API_KEY is not configured. Cannot fetch models reference from Auto.dev API.');
                throw new Error('Auto.dev API key is not configured');
            }
            const now = Date.now();
            if (!forceRefresh && this.makeModelsCache && now - this.makeModelsCache.fetchedAt < this.makeModelsCacheTtlMs) {
                return this.makeModelsCache.data;
            }
            const url = `${this.baseUrl}/api/models`;
            try {
                const response = yield fetch(url, {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json',
                    },
                });
                if (!response.ok) {
                    const errorText = yield response.text();
                    loggers_1.default.error(`Auto.dev models reference error (${response.status}): ${response.statusText}`, {
                        status: response.status,
                        statusText: response.statusText,
                        body: errorText.substring(0, 200),
                    });
                    throw new Error(`Auto.dev API error: ${response.statusText} (Status: ${response.status})`);
                }
                const json = yield response.json();
                const payload = ((_a = json === null || json === void 0 ? void 0 : json.data) !== null && _a !== void 0 ? _a : json);
                if (payload === null || payload === void 0 ? void 0 : payload.error) {
                    throw new Error(((_b = payload.error) === null || _b === void 0 ? void 0 : _b.message) || 'Auto.dev API error');
                }
                // Normalize possible response shapes into { [make]: string[] }
                let map = {};
                if (Array.isArray(payload)) {
                    for (const item of payload) {
                        const make = (_d = (_c = item === null || item === void 0 ? void 0 : item.make) !== null && _c !== void 0 ? _c : item === null || item === void 0 ? void 0 : item.brand) !== null && _d !== void 0 ? _d : item === null || item === void 0 ? void 0 : item.name;
                        const models = (_f = (_e = item === null || item === void 0 ? void 0 : item.models) !== null && _e !== void 0 ? _e : item === null || item === void 0 ? void 0 : item.model) !== null && _f !== void 0 ? _f : item === null || item === void 0 ? void 0 : item.values;
                        if (typeof make === 'string' && Array.isArray(models)) {
                            map[make] = models.filter((m) => typeof m === 'string');
                        }
                    }
                }
                else if (payload && typeof payload === 'object') {
                    const entries = Object.entries(payload);
                    const looksLikeMap = entries.every(([k, v]) => typeof k === 'string' && Array.isArray(v));
                    if (looksLikeMap) {
                        map = Object.fromEntries(entries.map(([k, v]) => [k, v.filter((m) => typeof m === 'string')]));
                    }
                }
                this.makeModelsCache = { fetchedAt: now, data: map };
                return map;
            }
            catch (error) {
                if ((_g = this.makeModelsCache) === null || _g === void 0 ? void 0 : _g.data) {
                    loggers_1.default.warn('Auto.dev fetchMakeModelsReference failed; returning cached copy:', (error === null || error === void 0 ? void 0 : error.message) || error);
                    return this.makeModelsCache.data;
                }
                loggers_1.default.error('Auto.dev fetchMakeModelsReference error:', error);
                throw error;
            }
        });
    }
    /**
     * Fetch all pages of listings from Auto.dev (for caching full result set in Redis).
     * Uses limit=100 per page; stops when a page returns fewer than 100 or maxPages is reached.
     */
    fetchAllListings(filters_1) {
        return __awaiter(this, arguments, void 0, function* (filters, maxPages = 50) {
            const all = [];
            const pageSize = 100;
            let page = 1;
            while (page <= maxPages) {
                const chunk = yield this.fetchListings(Object.assign(Object.assign({}, filters), { page, limit: pageSize }));
                all.push(...chunk);
                if (chunk.length < pageSize)
                    break;
                page++;
            }
            return all;
        });
    }
    /**
     * Fetch single listing by VIN
     */
    fetchListingByVIN(vin) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield fetch(`${this.baseUrl}/listings/${vin}`, {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json',
                    },
                });
                if (response.status === 404) {
                    return null;
                }
                if (!response.ok) {
                    throw ApiError_1.ApiError.internal(`Auto.dev API error: ${response.statusText}`);
                }
                const data = yield response.json();
                return data.data || null;
            }
            catch (error) {
                loggers_1.default.error('Auto.dev fetchListingByVIN error:', error);
                throw error;
            }
        });
    }
    /**
     * Decode VIN
     */
    decodeVIN(vin) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield fetch(`${this.baseUrl}/vin/${vin}`, {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json',
                    },
                });
                if (response.status === 404) {
                    return null;
                }
                if (!response.ok) {
                    throw ApiError_1.ApiError.badGateway(`Auto.dev API error: ${response.statusText}`);
                }
                const data = yield response.json();
                return data.data || null;
            }
            catch (error) {
                loggers_1.default.error('Auto.dev decodeVIN error:', error);
                throw error;
            }
        });
    }
    /**
     * Fetch vehicle photos
     */
    fetchPhotos(vin) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const response = yield fetch(`${this.baseUrl}/photos/${vin}`, {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json',
                    },
                });
                if (!response.ok) {
                    loggers_1.default.warn(`No photos found for VIN: ${vin}`);
                    return [];
                }
                const data = yield response.json();
                return ((_a = data.data) === null || _a === void 0 ? void 0 : _a.retail) || [];
            }
            catch (error) {
                loggers_1.default.error('Auto.dev fetchPhotos error:', error);
                return [];
            }
        });
    }
};
exports.AutoDevService = AutoDevService;
exports.AutoDevService = AutoDevService = __decorate([
    (0, inversify_1.injectable)()
], AutoDevService);
