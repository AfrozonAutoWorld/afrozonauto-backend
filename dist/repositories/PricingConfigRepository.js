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
exports.PricingConfigRepository = exports.DEFAULT_FEE_SETTINGS = void 0;
const inversify_1 = require("inversify");
const db_1 = __importDefault(require("../db"));
exports.DEFAULT_FEE_SETTINGS = {
    importDutyPercent: 35,
    vatPercent: 7.5,
    cissPercent: 15,
    sourcingFee: 5, // 5% of the initial vehicle amount
    prePurchaseInspectionUsd: 150,
    usHandlingFeeUsd: 350,
    shippingCostUsd: 1800,
    clearingFeeUsd: 800,
    portChargesUsd: 400,
    localDeliveryUsd: 200
};
let PricingConfigRepository = class PricingConfigRepository {
    constructor() { }
    getOrCreateSettings() {
        return __awaiter(this, void 0, void 0, function* () {
            let settings = yield db_1.default.feeSettings.findFirst();
            if (!settings) {
                settings = yield db_1.default.feeSettings.create({
                    data: exports.DEFAULT_FEE_SETTINGS
                });
            }
            return settings;
        });
    }
    updateSettings(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const settings = yield this.getOrCreateSettings();
            return db_1.default.feeSettings.update({
                where: { id: settings.id },
                data
            });
        });
    }
};
exports.PricingConfigRepository = PricingConfigRepository;
exports.PricingConfigRepository = PricingConfigRepository = __decorate([
    (0, inversify_1.injectable)(),
    __metadata("design:paramtypes", [])
], PricingConfigRepository);
