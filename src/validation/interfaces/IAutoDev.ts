
export type AutoDevMakeModelsReference = Record<string, string[]>;

/**
 * Params for GET /listings - pass directly to Auto.dev with dot notation.
 * See https://api.auto.dev/listings (vehicle.*, retailListing.*, etc.)
 */
export interface AutoDevListingsParams {
  'vehicle.make'?: string;
  'vehicle.model'?: string;
  'vehicle.year'?: string; // single year or range e.g. "2018-2020"
  'vehicle.bodyStyle'?: string;
  'vehicle.fuel'?: string; // Electric, Hybrid, Diesel, Plug-In Hybrid, etc.
  'vehicle.trim'?: string;
  'vehicle.transmission'?: string;
  'vehicle.exteriorColor'?: string;
  'vehicle.interiorColor'?: string;
  'vehicle.drivetrain'?: string; // AWD, FWD, RWD, 4WD
  'retailListing.price'?: string; // range e.g. "10000-30000"
  'retailListing.miles'?: string;  // range e.g. "0-50000"
  'retailListing.state'?: string;
  'retailListing.used'?: string;  // "true" | "false" – filter by used
  'retailListing.cpo'?: string;    // "true" | "false" – filter by certified pre-owned
  'wholesaleListing.state'?: string;
  'wholesaleListing.miles'?: string;
  'wholesaleListing.buyNowPrice'?: string;
  zip?: string;
  distance?: number;
  page?: number;
  limit?: number;
}