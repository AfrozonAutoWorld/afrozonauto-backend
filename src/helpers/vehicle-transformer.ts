import { Vehicle, VehicleType, VehicleSource, VehicleStatus } from '../generated/prisma/client';

export interface AutoDevListing {
  vin: string;
  make: string;
  model: string;
  year: number;
  price?: number;
  mileage?: number;
  bodyStyle?: string;
  transmission?: string;
  fuelType?: string;
  engineSize?: string;
  exteriorColor?: string;
  interiorColor?: string;
  dealerName?: string;
  dealerState?: string;
  dealerCity?: string;
  dealerZipCode?: string;
  features?: string[];
  [key: string]: any;
}

export interface AutoDevVINDecode {
  vin: string;
  make: string;
  model: string;
  year: number;
  bodyStyle?: string;
  transmission?: string;
  fuelType?: string;
  engineSize?: string;
  [key: string]: any;
}

export class VehicleTransformer {
  /**
   * Transform Auto.dev listing to our Vehicle model
   */
  static fromAutoDevListing(
    listing: AutoDevListing,
    photos: string[] = [],
    specs?: any
  ): Partial<Vehicle> {
    const vehicle = (listing as any).vehicle || listing;
    const retailListing = (listing as any).retailListing || {};
    
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
      source: VehicleSource.API,
      apiProvider: 'autodev',
      apiListingId: listing.vin || vehicle.vin,
      status: VehicleStatus.AVAILABLE,
      specifications: specs,
      isActive: true,
      isHidden: false,
    };
  }

  /**
   * Transform Auto.dev VIN decode to Vehicle model
   */
  static fromAutoDevVINDecode(decode: AutoDevVINDecode): Partial<Vehicle> {
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
      source: VehicleSource.API,
      apiProvider: 'autodev',
    };
  }

  /**
   * Generate SEO-friendly slug
   */
  private static generateSlug(
    make: string | undefined,
    model: string | undefined,
    year: number | undefined,
    vin: string | undefined
  ): string {
    const makeSlug = (make || 'unknown').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const modelSlug = (model || 'unknown').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const yearStr = year || 'unknown';
    const vinSuffix = (vin || 'unknown').slice(-6).toLowerCase();
    return `${yearStr}-${makeSlug}-${modelSlug}-${vinSuffix}`;
  }

  /**
   * Map body style to VehicleType enum
   */
  private static mapVehicleType(bodyStyle: string): VehicleType {
    const style = bodyStyle.toLowerCase();
    if (style.includes('suv')) return VehicleType.SUV;
    if (style.includes('truck')) return VehicleType.TRUCK;
    if (style.includes('van')) return VehicleType.VAN;
    if (style.includes('coupe')) return VehicleType.COUPE;
    if (style.includes('sedan')) return VehicleType.SEDAN;
    if (style.includes('hatchback')) return VehicleType.HATCHBACK;
    if (style.includes('wagon')) return VehicleType.WAGON;
    if (style.includes('convertible')) return VehicleType.CONVERTIBLE;
    return VehicleType.CAR;
  }
}

