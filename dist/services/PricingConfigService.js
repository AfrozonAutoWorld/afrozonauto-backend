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
const enums_1 = require("../generated/prisma/enums");
const ApiError_1 = require("../utils/ApiError");
const secrets_1 = require("../secrets");
let PricingConfigService = class PricingConfigService {
    constructor(settingsRepo) {
        this.settingsRepo = settingsRepo;
    }
    calculateTotalUsd(vehiclePriceUsd, shippingMethod) {
        return __awaiter(this, void 0, void 0, function* () {
            const fees = yield this.settingsRepo.getOrCreateSettings();
            const importDuty = (fees.importDutyPercent / 100) * vehiclePriceUsd;
            const sourcingFee = (fees.sourcingFee / 100) * vehiclePriceUsd;
            (fees.importDutyPercent / 100) * vehiclePriceUsd;
            const vat = (fees.vatPercent / 100) * vehiclePriceUsd;
            const ciss = (fees.cissPercent / 100) * vehiclePriceUsd;
            const shippingCostUsd = this.getShippingCostUsd(shippingMethod);
            const fixedFees = fees.prePurchaseInspectionUsd +
                sourcingFee +
                fees.usHandlingFeeUsd +
                fees.shippingCostUsd;
            // fees.clearingFeeUsd +
            // fees.portChargesUsd +
            // fees.localDeliveryUsd;
            const totalUsd = fixedFees + vehiclePriceUsd;
            return {
                totalUsd,
                totalUsedDeposit: totalUsd * Number(secrets_1.DEPOSIT_PERCENTAGE),
                shippingMethod,
                breakdown: {
                    vehiclePriceUsd,
                    prePurchaseInspectionUsd: fees.prePurchaseInspectionUsd,
                    usHandlingFeeUsd: fees.usHandlingFeeUsd,
                    sourcingFee,
                    // sourcingFee: fees.sourcingFee,
                    // shippingCostUsd: fees.shippingCostUsd
                    shippingCostUsd
                }
            };
        });
    }
    getShippingCostUsd(method) {
        switch (method) {
            case enums_1.ShippingMethod.RORO:
                return 1800;
            case enums_1.ShippingMethod.CONTAINER:
                return 2500;
            case enums_1.ShippingMethod.AIR_FREIGHT:
                return 5200;
            case enums_1.ShippingMethod.EXPRESS:
                return 7500;
            default:
                throw ApiError_1.ApiError.badRequest("Unsupported shipping method");
        }
    }
    calculatePaymentAmount(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            const totalAmountUsd = payload.totalAmountUsd;
            let depositPercentage = 0;
            let paymentAmount = 0;
            let isDeposit = false;
            switch (payload.paymentType) {
                case enums_1.PaymentType.DEPOSIT:
                    depositPercentage = Number(secrets_1.DEPOSIT_PERCENTAGE) * 100;
                    paymentAmount = totalAmountUsd * Number(secrets_1.DEPOSIT_PERCENTAGE);
                    isDeposit = true;
                    break;
                case enums_1.PaymentType.FULL_PAYMENT:
                    depositPercentage = 100;
                    paymentAmount = totalAmountUsd;
                    isDeposit = false;
                    break;
                default:
                    throw ApiError_1.ApiError.badRequest('Invalid payment type');
            }
            return {
                totalAmountUsd,
                paymentAmount,
                depositPercentage: isDeposit ? depositPercentage : 100,
                isDeposit,
                remainingBalance: isDeposit ? totalAmountUsd - paymentAmount : 0,
                paymentType: payload.paymentType
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
