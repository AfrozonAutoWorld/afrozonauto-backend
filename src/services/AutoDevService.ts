import { injectable } from 'inversify';
import { AUTO_DEV_API_KEY, AUTO_DEV_BASE_URL } from '../secrets';
import { VehicleTransformer, AutoDevListing, AutoDevVINDecode } from '../helpers/vehicle-transformer';
import loggers from '../utils/loggers';
import { ApiError } from '../utils/ApiError';
import {AutoDevResponse} from "../validation/interfaces/IVehicle"


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
      throw ApiError.internal('Auto.dev API key is not configured');
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
        throw ApiError.internal(`Auto.dev API error: ${response.statusText} (Status: ${response.status})`);
      }

      const data: AutoDevResponse<AutoDevListing[]> = await response.json();
      
      if (data.error) {
        loggers.error('Auto.dev API returned error:', data.error);
        throw  ApiError.internal(data.error.message || 'Auto.dev API error');
      }

      return data.data || [];
    } catch (error: any) {
      loggers.error('Auto.dev fetchListings error:', error);
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
  }, maxPages: number = 20): Promise<AutoDevListing[]> {
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
        throw ApiError.internal(`Auto.dev API error: ${response.statusText}`);
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
        throw  ApiError.badGateway(`Auto.dev API error: ${response.statusText}`);
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
  fetchSpecifications = async (vin: string): Promise<any> => {
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

