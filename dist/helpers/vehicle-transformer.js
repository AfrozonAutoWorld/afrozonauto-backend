"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VehicleTransformer = void 0;
const client_1 = require("../generated/prisma/client");
class VehicleTransformer {
    /**
     * Transform Auto.dev listing to our Vehicle model
     */
    static fromAutoDevListing(listing, photos = [], specs) {
        const vehicle = listing.vehicle || listing;
        const retailListing = listing.retailListing || {};
        return {
            vin: listing.vin || vehicle.vin,
            slug: this.generateSlug(vehicle.make, vehicle.model, vehicle.year, listing.vin || vehicle.vin),
            make: vehicle.make,
            model: vehicle.model,
            year: vehicle.year,
            priceUsd: retailListing.price || listing.price || 0,
            mileage: retailListing.mileage || listing.mileage,
            vehicleType: this.mapVehicleType(vehicle.bodyStyle || listing.bodyStyle || ''),
            transmission: vehicle.transmission || listing.transmission,
            fuelType: vehicle.fuel || listing.fuelType,
            engineSize: vehicle.engine || listing.engineSize,
            drivetrain: vehicle.drivetrain,
            exteriorColor: retailListing.exteriorColor || listing.exteriorColor,
            interiorColor: retailListing.interiorColor || listing.interiorColor,
            dealerName: retailListing.dealer || listing.dealerName,
            dealerState: retailListing.state || listing.dealerState,
            dealerCity: retailListing.city || listing.dealerCity,
            dealerZipCode: retailListing.zip || listing.dealerZipCode,
            images: photos,
            features: listing.features || [],
            source: client_1.VehicleSource.API,
            apiProvider: 'autodev',
            apiListingId: listing.vin || vehicle.vin,
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
        const makeSlug = (make || 'unknown').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        const modelSlug = (model || 'unknown').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        const yearStr = year || 'unknown';
        const vinSuffix = (vin || 'unknown').slice(-6).toLowerCase();
        return `${yearStr}-${makeSlug}-${modelSlug}-${vinSuffix}`;
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
