import { injectable } from 'inversify';
import { Prisma } from '../generated/prisma/client';
import prisma from '../db';

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
    sourcingFee: 5250,

    prePurchaseInspectionUsd: 150,
    usHandlingFeeUsd: 350,
    shippingCostUsd: 1800,

    clearingFeeUsd: 800,
    portChargesUsd: 400,
    localDeliveryUsd: 200
};


@injectable()
export class PricingConfigRepository {
    constructor() { }

    async getOrCreateSettings() {
        let settings = await prisma.feeSettings.findFirst();

        if (!settings) {
            settings = await prisma.feeSettings.create({
                data: DEFAULT_FEE_SETTINGS
            });
        }

        return settings;
    }

    async updateSettings(data: Partial<typeof DEFAULT_FEE_SETTINGS>) {
        const settings = await this.getOrCreateSettings();

        return prisma.feeSettings.update({
            where: { id: settings.id },
            data
        });
    }
}
