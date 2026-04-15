import { VehicleSource, VehicleStatus } from "../../generated/prisma/enums";

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
    vehicleType?: string;
    status?: VehicleStatus;
    source?: VehicleSource;
    dealerState?: string;
    isActive?: boolean;
    isHidden?: boolean;
    featured?: boolean;
    recommended?: boolean;
    specialty?: boolean;
    search?: string; // Search in model or VIN (make should be filtered explicitly, not searched)
    // Category-derived (from VehicleCategory: bodyStyle, fuel, luxuryMakes, priceMin)
    bodyStyle?: string;
    fuel?: string;
    luxuryMakes?: string[];
    // Vehicle details (DB + API)
    transmission?: string;
    exteriorColor?: string;
    interiorColor?: string;
    // Location radius (API only; passed to Auto.dev zip + distance)
    zip?: string;
    distance?: number;
    // Condition (API filter; new | used | cpo) and drivetrain (DB + API)
    condition?: 'new' | 'used' | 'cpo';
    drivetrain?: string; // AWD, FWD, RWD, 4WD
    /**
     * When true, `status` filter is respected or any status may appear (internal/admin).
     * When false/omitted, marketplace queries only return `AVAILABLE` vehicles.
     */
    allowAnyVehicleStatus?: boolean;
  }
  