import { Prisma } from "../../generated/prisma/client";

export interface FeeSettings {
    importDutyPercent: number;
    vatPercent: number;
    cissPercent: number;
    sourcingFeePercent: number;

    prePurchaseInspectionUsd: number;
    usHandlingFeeUsd: number;
    shippingCostUsd: number;

    clearingFeeUsd: number;
    portChargesUsd: number;
    localDeliveryUsd: number;
}

export const DEFAULT_FEE_SETTINGS: Prisma.FeeSettingsCreateInput = {
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
