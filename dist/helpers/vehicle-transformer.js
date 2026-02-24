"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VehicleTransformer = void 0;
const client_1 = require("../generated/prisma/client");
class VehicleTransformer {
    /**
     * Transform Auto.dev listing to our Vehicle model
     */
    static fromAutoDevListing(listing, photos = [], specs) {
        var _a, _b, _c, _d, _e;
        const vehicle = listing.vehicle || listing;
        const retailListing = listing.retailListing || {};
        // Use fetched photos when present; otherwise fall back to primaryImage from listing (e.g. from GET /listings)
        const primaryImage = retailListing.primaryImage;
        const images = photos.length > 0 ? photos : primaryImage ? [primaryImage] : [];
        const bodyStyleSource = vehicle.bodyStyle ||
            listing.bodyStyle ||
            `${(_a = vehicle.make) !== null && _a !== void 0 ? _a : ''} ${(_b = vehicle.model) !== null && _b !== void 0 ? _b : ''}`;
        return {
            vin: listing.vin || vehicle.vin,
            slug: this.generateSlug(vehicle.make, vehicle.model, vehicle.year, listing.vin || vehicle.vin),
            make: vehicle.make,
            model: vehicle.model,
            year: vehicle.year,
            priceUsd: retailListing.price || listing.price || 0,
            mileage: (_e = (_d = (_c = retailListing.miles) !== null && _c !== void 0 ? _c : retailListing.mileage) !== null && _d !== void 0 ? _d : listing.miles) !== null && _e !== void 0 ? _e : listing.mileage,
            vehicleType: this.mapVehicleType(bodyStyleSource || ''),
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
        const style = (bodyStyle || '').toLowerCase();
        if (!style)
            return client_1.VehicleType.CAR;
        // SUVs and crossovers
        if (style.includes('suv') || style.includes('crossover'))
            return client_1.VehicleType.SUV;
        // Trucks and pickups
        if (style.includes('truck') || style.includes('pickup'))
            return client_1.VehicleType.TRUCK;
        // Vans / minivans
        if (style.includes('van') || style.includes('minivan'))
            return client_1.VehicleType.VAN;
        if (style.includes('coupe'))
            return client_1.VehicleType.COUPE;
        // Sedans / saloons
        if (style.includes('sedan') || style.includes('saloon'))
            return client_1.VehicleType.SEDAN;
        if (style.includes('hatchback'))
            return client_1.VehicleType.HATCHBACK;
        // Wagons / estates
        if (style.includes('wagon') || style.includes('estate'))
            return client_1.VehicleType.WAGON;
        // Convertibles / cabriolets
        if (style.includes('convertible') || style.includes('cabrio'))
            return client_1.VehicleType.CONVERTIBLE;
        // Motorcycles / bikes
        if (style.includes('motorcycle') || style.includes('motorbike') || style.includes('bike')) {
            return client_1.VehicleType.MOTORCYCLE;
        }
        // Hummer (often missing bodyStyle in API) – treat as SUV
        if (style.includes('hummer'))
            return client_1.VehicleType.SUV;
        // Fallback
        return client_1.VehicleType.CAR;
    }
    static vehicleTypeToBodyStyle(vehicleType) {
        var _a;
        const map = {
            [client_1.VehicleType.CAR]: 'sedan',
            [client_1.VehicleType.SEDAN]: 'sedan',
            [client_1.VehicleType.SUV]: 'suv',
            [client_1.VehicleType.TRUCK]: 'truck',
            [client_1.VehicleType.VAN]: 'van',
            [client_1.VehicleType.COUPE]: 'coupe',
            [client_1.VehicleType.HATCHBACK]: 'hatchback',
            [client_1.VehicleType.WAGON]: 'wagon',
            [client_1.VehicleType.CONVERTIBLE]: 'convertible',
            [client_1.VehicleType.MOTORCYCLE]: '',
            [client_1.VehicleType.OTHER]: '',
        };
        return (_a = map[vehicleType]) !== null && _a !== void 0 ? _a : '';
    }
}
exports.VehicleTransformer = VehicleTransformer;
