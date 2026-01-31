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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PricingConfigService = void 0;
const PricingConfigRepository_1 = require("../repositories/PricingConfigRepository");
const inversify_1 = require("inversify");
const types_1 = require("../config/types");
const prismaNamespace_1 = require("../generated/prisma/internal/prismaNamespace");
let PricingConfigService = class PricingConfigService {
    constructor(settingsRepo) {
        this.settingsRepo = settingsRepo;
    }
    calculateTotalUsd(vehiclePriceUsd) {
        return __awaiter(this, void 0, void 0, function* () {
            const fees = yield this.settingsRepo.getOrCreateSettings();
            const importDuty = (fees.importDutyPercent / 100) * vehiclePriceUsd;
            const vat = (fees.vatPercent / 100) * vehiclePriceUsd;
            const ciss = (fees.cissPercent / 100) * vehiclePriceUsd;
            const fixedFees = fees.prePurchaseInspectionUsd +
                fees.sourcingFee +
                fees.usHandlingFeeUsd +
                fees.shippingCostUsd;
            // fees.clearingFeeUsd +
            // fees.portChargesUsd +
            // fees.localDeliveryUsd;
            const totalUsd = fixedFees + vehiclePriceUsd;
            return {
                totalUsd,
                breakdown: {
                    vehiclePriceUsd,
                    importDuty,
                    vat,
                    ciss,
                    sourcingFee: fees.sourcingFee,
                }
            };
        });
    }
    calculateTotal(input) {
        return __awaiter(this, void 0, void 0, function* () {
            const fees = yield this.settingsRepo.getOrCreateSettings();
            const priceUsd = new prismaNamespace_1.Decimal(input.productPriceUsd);
            // Percentage fees
            const importDuty = priceUsd.mul(fees.importDutyPercent).div(100);
            const vat = priceUsd.mul(fees.vatPercent).div(100);
            const ciss = priceUsd.mul(fees.cissPercent).div(100);
            const sourcingFee = fees.sourcingFee;
            // Fixed USD fees
            const fixedFeesUsd = new prismaNamespace_1.Decimal(fees.prePurchaseInspectionUsd)
                .plus(fees.usHandlingFeeUsd)
                .plus(fees.shippingCostUsd)
                .plus(fees.clearingFeeUsd)
                .plus(fees.portChargesUsd)
                .plus(fees.localDeliveryUsd);
            const totalUsd = priceUsd
                .plus(importDuty)
                .plus(vat)
                .plus(ciss)
                .plus(sourcingFee)
                .plus(fixedFeesUsd);
            const totalNgn = totalUsd.mul(input.exchangeRate);
            return {
                breakdown: {
                    productPriceUsd: priceUsd.toNumber(),
                    importDuty: importDuty.toNumber(),
                    vat: vat.toNumber(),
                    ciss: ciss.toNumber(),
                    sourcingFee: sourcingFee,
                    fixedFeesUsd: fixedFeesUsd.toNumber(),
                },
                totalUsd: totalUsd.toNumber(),
                totalNgn: totalNgn.toDecimalPlaces(0).toNumber()
            };
        });
    }
};
exports.PricingConfigService = PricingConfigService;
exports.PricingConfigService = PricingConfigService = __decorate([
    (0, inversify_1.injectable)(),
    __param(0, (0, inversify_1.inject)(types_1.TYPES.PricingConfigRepository)),
    __metadata("design:paramtypes", [PricingConfigRepository_1.PricingConfigRepository])
], PricingConfigService);
