import { VehicleSource, VehicleStatus } from "../../generated/prisma/enums";

export interface AutoDevResponse<T> {
    data?: T;
    error?: {
      message: string;
      code: string;
    };
  }


  export interface VehicleFilters {
    /**
     * Comma-separated list of makes. Combined with `model`:
     * - **Same count as `model`:** positional pairs — (make₀ ∧ model₀) ∨ (make₁ ∧ model₁) ∨ …
     * - **One model, several makes:** that model is applied per OEM rules (some makes may be unrestricted).
     * - **One make, several models:** make ∧ (model₀ ∨ model₁ ∨ …).
     */
    make?: string;
    /** Comma-separated model names; pairing with `make` follows the rules above. */
    model?: string;
    yearMin?: number;
    yearMax?: number;
    priceMin?: number;
    priceMax?: number;
    mileageMax?: number;
    /** Comma-separated OR (e.g. SUV,CAR). */
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
    section?: string;
    /**
     * When true, `status` filter is respected or any status may appear (internal/admin).
     * When false/omitted, marketplace queries only return `AVAILABLE` vehicles.
     */
    allowAnyVehicleStatus?: boolean;
  }
  