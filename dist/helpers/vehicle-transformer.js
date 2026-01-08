"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VehicleTransformer = void 0;
const client_1 = require("../generated/prisma/client");
class VehicleTransformer {
    /**
     * Transform Auto.dev listing to our Vehicle model
     */
    static fromAutoDevListing(listing, photos = [], specs) {
        return {
            vin: listing.vin,
            slug: this.generateSlug(listing.make, listing.model, listing.year, listing.vin),
            make: listing.make,
            model: listing.model,
            year: listing.year,
            priceUsd: listing.price || 0,
            mileage: listing.mileage,
            vehicleType: this.mapVehicleType(listing.bodyStyle || ''),
            transmission: listing.transmission,
            fuelType: listing.fuelType,
            engineSize: listing.engineSize,
            exteriorColor: listing.exteriorColor,
            interiorColor: listing.interiorColor,
            dealerName: listing.dealerName,
            dealerState: listing.dealerState,
            dealerCity: listing.dealerCity,
            dealerZipCode: listing.dealerZipCode,
            images: photos,
            features: listing.features || [],
            source: client_1.VehicleSource.API,
            apiProvider: 'autodev',
            apiListingId: listing.vin,
            status: client_1.VehicleStatus.AVAILABLE,
            specifications: specs,
            isActive: true,
            isHidden: false,
        };
    }
    /**
     * Transform Auto.dev VIN decode to Vehicle model
     */
    static fromAutoDevVINDecode(decode) {
        return {
            vin: decode.vin,
            slug: this.generateSlug(decode.make, decode.model, decode.year, decode.vin),
            make: decode.make,
            model: decode.model,
            year: decode.year,
            vehicleType: this.mapVehicleType(decode.bodyStyle || ''),
            transmission: decode.transmission,
            fuelType: decode.fuelType,
            engineSize: decode.engineSize,
            source: client_1.VehicleSource.API,
            apiProvider: 'autodev',
        };
    }
    /**
     * Generate SEO-friendly slug
     */
    static generateSlug(make, model, year, vin) {
        const makeSlug = make.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        const modelSlug = model.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        const vinSuffix = vin.slice(-6).toLowerCase();
        return `${year}-${makeSlug}-${modelSlug}-${vinSuffix}`;
    }
    /**
     * Map body style to VehicleType enum
     */
    static mapVehicleType(bodyStyle) {
        const style = bodyStyle.toLowerCase();
        if (style.includes('suv'))
            return client_1.VehicleType.SUV;
        if (style.includes('truck'))
            return client_1.VehicleType.TRUCK;
        if (style.includes('van'))
            return client_1.VehicleType.VAN;
        if (style.includes('coupe'))
            return client_1.VehicleType.COUPE;
        if (style.includes('sedan'))
            return client_1.VehicleType.SEDAN;
        if (style.includes('hatchback'))
            return client_1.VehicleType.HATCHBACK;
        if (style.includes('wagon'))
            return client_1.VehicleType.WAGON;
        if (style.includes('convertible'))
            return client_1.VehicleType.CONVERTIBLE;
        return client_1.VehicleType.CAR;
    }
}
exports.VehicleTransformer = VehicleTransformer;
