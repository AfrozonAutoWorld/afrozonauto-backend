import { injectable } from 'inversify';
import { AUTO_DEV_API_KEY, AUTO_DEV_BASE_URL } from '../secrets';
import { VehicleTransformer, AutoDevListing, AutoDevVINDecode } from '../helpers/vehicle-transformer';
import loggers from '../utils/loggers';

interface AutoDevResponse<T> {
  data?: T;
  error?: {
    message: string;
    code: string;
  };
}

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
  'retailListing.price'?: string; // range e.g. "10000-30000"
  'retailListing.miles'?: string;  // range e.g. "0-50000"
  'retailListing.state'?: string;
  'wholesaleListing.state'?: string;
  'wholesaleListing.miles'?: string;
  'wholesaleListing.buyNowPrice'?: string;
  zip?: string;
  distance?: number;
  page?: number;
  limit?: number;
}

@injectable()
export class AutoDevService {
  private readonly baseUrl = AUTO_DEV_BASE_URL || 'https://api.auto.dev';
  private readonly apiKey = AUTO_DEV_API_KEY;

  /**
   * Fetch vehicle listings from Auto.dev
   */
  async fetchListings(filters: {
    make?: string;
    model?: string;
    year?: number;
    zip?: string;
    distance?: number;
    page?: number;
    limit?: number;
  }): Promise<AutoDevListing[]> {
    if (!this.apiKey) {
      loggers.warn('AUTO_DEV_API_KEY is not configured. Cannot fetch listings from Auto.dev API.');
      throw new Error('Auto.dev API key is not configured');
    }

    try {
      const params = new URLSearchParams();
      if (filters.make) params.append('vehicle.make', filters.make);
      if (filters.model) params.append('vehicle.model', filters.model);
      if (filters.year) params.append('vehicle.year', filters.year.toString());
      if (filters.zip) params.append('zip', filters.zip);
      if (filters.distance) params.append('distance', filters.distance.toString());
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());

      const response = await fetch(`${this.baseUrl}/listings?${params}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        loggers.error(`Auto.dev API error (${response.status}): ${response.statusText}`, { 
          status: response.status,
          statusText: response.statusText,
          body: errorText.substring(0, 200)
        });
        throw new Error(`Auto.dev API error: ${response.statusText} (Status: ${response.status})`);
      }

      const data: AutoDevResponse<AutoDevListing[]> = await response.json();
      
      if (data.error) {
        loggers.error('Auto.dev API returned error:', data.error);
        throw new Error(data.error.message || 'Auto.dev API error');
      }

      return data.data || [];
    } catch (error: any) {
      loggers.error('Auto.dev fetchListings error:', error);
      throw error;
    }
  }

  async fetchListingsWithParams(params: AutoDevListingsParams): Promise<AutoDevListing[]> {
    if (!this.apiKey) {
      loggers.warn('AUTO_DEV_API_KEY is not configured. Cannot fetch listings from Auto.dev API.');
      throw new Error('Auto.dev API key is not configured');
    }

    const searchParams = new URLSearchParams();
    const keys: (keyof AutoDevListingsParams)[] = [
      'vehicle.make', 'vehicle.model', 'vehicle.year', 'vehicle.bodyStyle', 'vehicle.fuel', 'vehicle.trim',
      'vehicle.transmission', 'vehicle.exteriorColor', 'vehicle.interiorColor',
      'retailListing.price', 'retailListing.miles', 'retailListing.state',
      'wholesaleListing.state', 'wholesaleListing.miles', 'wholesaleListing.buyNowPrice',
      'zip', 'page', 'limit', 'distance',
    ];
    for (const key of keys) {
      const v = params[key];
      if (v === undefined || v === null || v === '') continue;
      if (key === 'distance' && typeof v === 'number') {
        searchParams.append(key, String(v));
      } else if (key === 'page' || key === 'limit') {
        if (typeof v === 'number') searchParams.append(key, String(v));
      } else if (typeof v === 'string') {
        searchParams.append(key, v);
      }
    }

    const url = `${this.baseUrl}/listings?${searchParams}`;
    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        loggers.error(`Auto.dev API error (${response.status}): ${response.statusText}`, {
          status: response.status,
          statusText: response.statusText,
          body: errorText.substring(0, 200),
        });
        throw new Error(`Auto.dev API error: ${response.statusText} (Status: ${response.status})`);
      }

      const data: AutoDevResponse<AutoDevListing[]> = await response.json();
      if (data.error) {
        loggers.error('Auto.dev API returned error:', data.error);
        throw new Error(data.error.message || 'Auto.dev API error');
      }
      return data.data || [];
    } catch (error: any) {
      loggers.error('Auto.dev fetchListingsWithParams error:', error);
      throw error;
    }
  }

  /**
   * Fetch all pages of listings from Auto.dev (for caching full result set in Redis).
   * Uses limit=100 per page; stops when a page returns fewer than 100 or maxPages is reached.
   */
  async fetchAllListings(filters: {
    make?: string;
    model?: string;
    year?: number;
    zip?: string;
    distance?: number;
  }, maxPages: number = 50): Promise<AutoDevListing[]> {
    const all: AutoDevListing[] = [];
    const pageSize = 100;
    let page = 1;

    while (page <= maxPages) {
      const chunk = await this.fetchListings({ ...filters, page, limit: pageSize });
      all.push(...chunk);
      if (chunk.length < pageSize) break;
      page++;
    }

    return all;
  }

  /**
   * Fetch single listing by VIN
   */
  async fetchListingByVIN(vin: string): Promise<AutoDevListing | null> {
    try {
      const response = await fetch(`${this.baseUrl}/listings/${vin}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`Auto.dev API error: ${response.statusText}`);
      }

      const data: AutoDevResponse<AutoDevListing> = await response.json();
      return data.data || null;
    } catch (error) {
      loggers.error('Auto.dev fetchListingByVIN error:', error);
      throw error;
    }
  }

  /**
   * Decode VIN
   */
  async decodeVIN(vin: string): Promise<AutoDevVINDecode | null> {
    try {
      const response = await fetch(`${this.baseUrl}/vin/${vin}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`Auto.dev API error: ${response.statusText}`);
      }

      const data: AutoDevResponse<AutoDevVINDecode> = await response.json();
      return data.data || null;
    } catch (error) {
      loggers.error('Auto.dev decodeVIN error:', error);
      throw error;
    }
  }

  /**
   * Fetch vehicle photos
   */
  async fetchPhotos(vin: string): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/photos/${vin}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        loggers.warn(`No photos found for VIN: ${vin}`);
        return [];
      }

      const data: AutoDevResponse<{ retail: string[] }> = await response.json();
      return data.data?.retail || [];
    } catch (error) {
      loggers.error('Auto.dev fetchPhotos error:', error);
      return [];
    }
  }

  /**
   * Fetch vehicle specifications
   */
  async fetchSpecifications(vin: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/specs/${vin}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data.specs || null;
    } catch (error) {
      loggers.error('Auto.dev fetchSpecifications error:', error);
      return null;
    }
  }
}

