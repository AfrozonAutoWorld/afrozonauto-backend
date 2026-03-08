import { SourcingRequestStatus } from '../../generated/prisma/client';

/**
 * Payload from Find a Car form (all 3 steps combined).
 * Matches frontend FindACarStep1Data + FindACarStep2Data + FindACarStep3Data.
 */
export interface CreateSourcingRequestDto {
  // Step 1: Car
  make: string;
  model: string;
  yearFrom?: string; // empty or "Any" => null
  yearTo?: string;
  trim?: string;
  condition: 'used' | 'new' | 'either';

  // Step 2: Preferences
  budgetUsd: string;
  exteriorColor: string;
  anyColor: boolean;
  shipping: 'roro' | 'container';
  timeline: string; // 'asap' | '1-3' | '3-6' | 'flexible'

  // Step 3: Contact
  firstName: string;
  lastName: string;
  email: string;
  phoneCountryCode?: string;
  phoneNumber: string;
  deliveryCity?: string;
  additionalNotes?: string;
  consentContact: boolean;
}

export interface SourcingRequestListItem {
  id: string;
  requestNumber: string;
  status: SourcingRequestStatus;
  make: string;
  model: string;
  yearFrom: number | null;
  yearTo: number | null;
  condition: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  deliveryCity: string | null;
  shippingMethod: string;
  timeline: string;
  createdAt: Date;
}

export interface SourcingRequestWithDetails extends SourcingRequestListItem {
  trim: string | null;
  budgetUsd: string | null;
  exteriorColor: string | null;
  anyColor: boolean;
  additionalNotes: string | null;
  consentContact: boolean;
  phoneCode: string;
  updatedAt: Date;
}
