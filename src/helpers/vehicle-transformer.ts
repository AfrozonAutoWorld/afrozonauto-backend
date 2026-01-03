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
      source: VehicleSource.API,
      apiProvider: 'autodev',
      apiListingId: listing.vin,
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
    make: string,
    model: string,
    year: number,
    vin: string
  ): string {
    const makeSlug = make.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const modelSlug = model.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const vinSuffix = vin.slice(-6).toLowerCase();
    return `${year}-${makeSlug}-${modelSlug}-${vinSuffix}`;
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

