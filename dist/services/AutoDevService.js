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
let AutoDevService = class AutoDevService {
    constructor() {
        this.baseUrl = secrets_1.AUTO_DEV_BASE_URL || 'https://api.auto.dev';
        this.apiKey = secrets_1.AUTO_DEV_API_KEY;
    }
    /**
     * Fetch vehicle listings from Auto.dev
     */
    fetchListings(filters) {
        return __awaiter(this, void 0, void 0, function* () {
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
                    throw new Error(`Auto.dev API error: ${response.statusText}`);
                }
                const data = yield response.json();
                if (data.error) {
                    throw new Error(data.error.message);
                }
                return data.data || [];
            }
            catch (error) {
                loggers_1.default.error('Auto.dev fetchListings error:', error);
                throw error;
            }
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
                    throw new Error(`Auto.dev API error: ${response.statusText}`);
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
                    throw new Error(`Auto.dev API error: ${response.statusText}`);
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
    /**
     * Fetch vehicle specifications
     */
    fetchSpecifications(vin) {
        return __awaiter(this, void 0, void 0, function* () {
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
};
exports.AutoDevService = AutoDevService;
exports.AutoDevService = AutoDevService = __decorate([
    (0, inversify_1.injectable)()
], AutoDevService);
