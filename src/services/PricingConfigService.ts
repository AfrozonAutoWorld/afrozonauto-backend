import { PricingConfigRepository } from "../repositories/PricingConfigRepository";
import { injectable, inject} from 'inversify';
import { TYPES } from '../config/types';
import { Decimal } from "../generated/prisma/internal/prismaNamespace";
import { ShippingMethod } from "../generated/prisma/enums";


export interface IPricingConfigService {
  calculateTotalUsd(vehiclePriceUsd: number,  shippingMethod: ShippingMethod): Promise<any>;
}

interface CalculatePaymentInput {
  productPriceUsd: number;
  exchangeRate: number; // USD → NGN
}

@injectable()
export class PricingConfigService implements IPricingConfigService {
  constructor(
    @inject(TYPES.PricingConfigRepository) private settingsRepo: PricingConfigRepository,
  ) {}

  async calculateTotalUsd(vehiclePriceUsd: number,  shippingMethod: ShippingMethod){
    const fees = await this.settingsRepo.getOrCreateSettings();

    const importDuty =
      (fees.importDutyPercent / 100) * vehiclePriceUsd;

    const vat =
      (fees.vatPercent / 100) * vehiclePriceUsd;

    const ciss =
      (fees.cissPercent / 100) * vehiclePriceUsd;

      const shippingCostUsd =
      this.getShippingCostUsd(shippingMethod);

    const   fixedFees =
      fees.prePurchaseInspectionUsd +
      fees.sourcingFee +
      fees.usHandlingFeeUsd +
      fees.shippingCostUsd
      // fees.clearingFeeUsd +
      // fees.portChargesUsd +
      // fees.localDeliveryUsd;

  const totalUsd = fixedFees + vehiclePriceUsd 
    
    return {
      totalUsd,
      shippingMethod,
      breakdown: {
        vehiclePriceUsd,
        prePurchaseInspectionUsd: fees.prePurchaseInspectionUsd ,
        usHandlingFeeUsd: fees.usHandlingFeeUsd,
        sourcingFee: fees.sourcingFee,
        // shippingCostUsd: fees.shippingCostUsd
        shippingCostUsd
      }
    };
  }

  async calculateTotal(input: CalculatePaymentInput) {
    const fees = await this.settingsRepo.getOrCreateSettings();

    const priceUsd = new Decimal(input.productPriceUsd);

    // Percentage fees
    const importDuty = priceUsd.mul(fees.importDutyPercent).div(100);
    const vat = priceUsd.mul(fees.vatPercent).div(100);
    const ciss = priceUsd.mul(fees.cissPercent).div(100);
    const sourcingFee = fees.sourcingFee;

    // Fixed USD fees
    const fixedFeesUsd = new Decimal(fees.prePurchaseInspectionUsd)
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
  }

  getShippingCostUsd(method: ShippingMethod): number {
    switch (method) {
      case ShippingMethod.RORO:
        return 1800;
      case ShippingMethod.CONTAINER:
        return 2500;
      case ShippingMethod.AIR_FREIGHT:
        return 5200;
      case ShippingMethod.EXPRESS:
        return 7500;
      default:
        throw new Error("Unsupported shipping method");
    }
  }
}
