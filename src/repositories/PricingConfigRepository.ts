import { injectable } from 'inversify';
import prisma from '../db';
import { DEFAULT_FEE_SETTINGS } from '../validation/interfaces/IPricing';


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
