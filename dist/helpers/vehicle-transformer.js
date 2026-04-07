"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VehicleTransformer = void 0;
const client_1 = require("../generated/prisma/client");
class VehicleTransformer {
    /**
     * Transform Auto.dev listing to our Vehicle model
     */
    static fromAutoDevListing(listing, photos = [], specs) {
        var _a, _b, _c;
        const vehicle = listing.vehicle || listing;
        const retailListing = listing.retailListing || {};
        // Use fetched photos when present; otherwise fall back to primaryImage from listing (e.g. from GET /listings)
        const primaryImage = retailListing.primaryImage;
        const images = photos.length > 0 ? photos : primaryImage ? [primaryImage] : [];
        const bodyStyleSource = vehicle.bodyStyle ||
            listing.bodyStyle ||
            '';
        const typeSource = vehicle.type ||
            listing.type ||
            vehicle.style ||
            listing.style ||
            '';
        return {
            vin: listing.vin || vehicle.vin,
            slug: this.generateSlug(vehicle.make, vehicle.model, vehicle.year, listing.vin || vehicle.vin),
            make: vehicle.make,
            model: vehicle.model,
            year: vehicle.year,
            priceUsd: retailListing.price || listing.price || 0,
            mileage: (_c = (_b = (_a = retailListing.miles) !== null && _a !== void 0 ? _a : retailListing.mileage) !== null && _b !== void 0 ? _b : listing.miles) !== null && _c !== void 0 ? _c : listing.mileage,
            vehicleType: this.mapVehicleTypeFromAutoDev(typeSource, bodyStyleSource),
            // Keep original broad body style from Auto.dev (e.g. Car, SUV, Truck, Van).
            bodyStyle: bodyStyleSource || undefined,
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
            images,
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
            vehicleType: this.mapVehicleTypeFromAutoDev(decode.type, decode.bodyStyle || ''),
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
        const makeStr = typeof make === 'string' ? make : String(make !== null && make !== void 0 ? make : 'unknown');
        const modelStr = typeof model === 'string' ? model : String(model !== null && model !== void 0 ? model : 'unknown');
        const makeSlug = makeStr.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        const modelSlug = modelStr.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        const yearStr = year != null ? String(year) : 'unknown';
        const vinSuffix = (vin || 'unknown').slice(-6).toLowerCase();
        return `${yearStr}-${makeSlug}-${modelSlug}-${vinSuffix}`;
    }
    /**
     * Map body style to VehicleType enum
     */
    static mapVehicleType(bodyStyle) {
        const style = (bodyStyle || '').toLowerCase();
        if (!style)
            return 'CAR';
        // SUVs and crossovers
        if (style.includes('suv') || style.includes('crossover'))
            return 'SUV';
        // Trucks and pickups
        if (style.includes('truck') || style.includes('pickup'))
            return 'TRUCK';
        // Vans / minivans
        if (style.includes('van') || style.includes('minivan'))
            return 'VAN';
        if (style.includes('coupe'))
            return 'COUPE';
        // Sedans / saloons
        if (style.includes('sedan') || style.includes('saloon'))
            return 'SEDAN';
        if (style.includes('hatchback'))
            return 'HATCHBACK';
        // Wagons / estates
        if (style.includes('wagon') || style.includes('estate'))
            return 'WAGON';
        // Convertibles / cabriolets
        if (style.includes('convertible') || style.includes('cabrio'))
            return 'CONVERTIBLE';
        // Motorcycles / bikes
        if (style.includes('motorcycle') || style.includes('motorbike') || style.includes('bike')) {
            return 'MOTORCYCLE';
        }
        // Hummer (often missing bodyStyle in API) – treat as SUV
        if (style.includes('hummer'))
            return 'SUV';
        // Fallback
        return 'CAR';
    }
    /**
     * Prefer Auto.dev `vehicle.type` (more specific), then fall back to bodyStyle.
     * Example: bodyStyle can be "Car" while type is "Sedan".
     */
    static mapVehicleTypeFromAutoDev(typeValue, bodyStyle) {
        const type = (typeValue || '').toLowerCase();
        if (type) {
            if (type.includes('crossover') || type.includes('suv'))
                return 'SUV';
            if (type.includes('pickup') || type.includes('truck'))
                return 'TRUCK';
            if (type.includes('minivan') || type.includes('van'))
                return 'VAN';
            if (type.includes('coupe'))
                return 'COUPE';
            if (type.includes('sedan') || type.includes('saloon'))
                return 'SEDAN';
            if (type.includes('hatchback'))
                return 'HATCHBACK';
            if (type.includes('wagon') || type.includes('estate'))
                return 'WAGON';
            if (type.includes('convertible') || type.includes('cabrio') || type.includes('roadster')) {
                return 'CONVERTIBLE';
            }
            if (type.includes('motorcycle') || type.includes('motorbike') || type.includes('bike')) {
                return 'MOTORCYCLE';
            }
            if (type.includes('car'))
                return 'CAR';
        }
        return this.mapVehicleType(bodyStyle || '');
    }
}
exports.VehicleTransformer = VehicleTransformer;
