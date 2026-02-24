import { VehicleSource, VehicleStatus, VehicleType } from "../../generated/prisma/enums";

export interface AutoDevResponse<T> {
    data?: T;
    error?: {
      message: string;
      code: string;
    };
  }


  export interface VehicleFilters {
    make?: string;
    model?: string;
    yearMin?: number;
    yearMax?: number;
    priceMin?: number;
    priceMax?: number;
    mileageMax?: number;
    vehicleType?: VehicleType;
    status?: VehicleStatus;
    source?: VehicleSource;
    dealerState?: string;
    isActive?: boolean;
    isHidden?: boolean;
    featured?: boolean;
    search?: string; // Search in model or VIN (make should be filtered explicitly, not searched)
    // Category-derived (from VehicleCategory: bodyStyle, fuel, luxuryMakes, priceMin)
    bodyStyle?: string;
    fuel?: string;
    luxuryMakes?: string[];
  }
  