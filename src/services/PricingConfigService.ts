import { PricingConfigRepository } from "../repositories/PricingConfigRepository";
import { injectable, inject} from 'inversify';
import { TYPES } from '../config/types';
import { Decimal } from "../generated/prisma/internal/prismaNamespace";
import { PaymentType, ShippingMethod } from "../generated/prisma/enums";
import { ApiError } from "../utils/ApiError";
import { DEPOSIT_PERCENTAGE } from "../secrets";


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
      totalUsedDeposit: totalUsd * Number(DEPOSIT_PERCENTAGE),
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
        throw ApiError.badRequest("Unsupported shipping method");
    }
  }

  async calculatePaymentAmount(payload: {
    totalAmountUsd: number;
    paymentType: PaymentType;
  }) {


    const totalAmountUsd: number =  payload.totalAmountUsd
    
    let depositPercentage = 0;
    let paymentAmount = 0;
    let isDeposit = false;

    switch (payload.paymentType) {
      case PaymentType.DEPOSIT:
        depositPercentage =  Number(DEPOSIT_PERCENTAGE) * 100 
        paymentAmount = totalAmountUsd * Number(DEPOSIT_PERCENTAGE);
        isDeposit = true;
        break;
      
      case PaymentType.FULL_PAYMENT:
        depositPercentage =  100 
        paymentAmount = totalAmountUsd;
        isDeposit = false;
        break;
      
      default:
        throw ApiError.badRequest('Invalid payment type');
    }


    return {
      totalAmountUsd,
      paymentAmount,
      depositPercentage: isDeposit ? depositPercentage : 100,
      isDeposit,
      remainingBalance: isDeposit ? totalAmountUsd - paymentAmount : 0,
      paymentType: payload.paymentType
    };
  }
}
