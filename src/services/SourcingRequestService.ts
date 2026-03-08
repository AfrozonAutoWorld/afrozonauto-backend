import { injectable, inject } from 'inversify';
import { SourcingRequestRepository } from '../repositories/SourcingRequestRepository';
import { TYPES } from '../config/types';
import { ApiError } from '../utils/ApiError';
import { SourcingRequestStatus, ShippingMethod } from '../generated/prisma/client';
import type {
  CreateSourcingRequestDto,
  SourcingRequestListItem,
  SourcingRequestWithDetails,
} from '../validation/interfaces/ISourcingRequest';
import type { SourcingRequestFilters } from '../repositories/SourcingRequestRepository';

function parseYear(value: string | undefined): number | null {
  if (!value || value.trim() === '' || value.toLowerCase() === 'any') return null;
  const n = parseInt(value, 10);
  return Number.isNaN(n) ? null : n;
}

@injectable()
export class SourcingRequestService {
  constructor(
    @inject(TYPES.SourcingRequestRepository)
    private readonly repo: SourcingRequestRepository
  ) {}

  async create(dto: CreateSourcingRequestDto, userId?: string): Promise<SourcingRequestWithDetails> {
    const requestNumber = this.generateRequestNumber();
    const yearFrom = parseYear(dto.yearFrom);
    const yearTo = parseYear(dto.yearTo);

    const record = await this.repo.create({
      requestNumber,
      status: SourcingRequestStatus.NEW,
      ...(userId && { user: { connect: { id: userId } } }),
      make: dto.make.trim(),
      model: dto.model.trim(),
      yearFrom: yearFrom ?? undefined,
      yearTo: yearTo ?? undefined,
      trim: dto.trim?.trim() || undefined,
      condition: dto.condition.toUpperCase(),
      budgetUsd: dto.budgetUsd?.trim() || undefined,
      exteriorColor: dto.exteriorColor?.trim() || undefined,
      anyColor: dto.anyColor,
      shippingMethod: dto.shipping.toLowerCase() === 'container' ? ShippingMethod.CONTAINER : ShippingMethod.RORO,
      timeline: dto.timeline.trim(),
      firstName: dto.firstName.trim(),
      lastName: dto.lastName.trim(),
      email: dto.email.trim().toLowerCase(),
      phoneCode: (dto.phoneCountryCode || '+234').trim(),
      phoneNumber: dto.phoneNumber.trim(),
      deliveryCity: dto.deliveryCity?.trim() || undefined,
      additionalNotes: dto.additionalNotes?.trim() || undefined,
      consentContact: dto.consentContact,
    });

    return this.toWithDetails(record);
  }

  private generateRequestNumber(): string {
    const year = new Date().getFullYear().toString().slice(-2);
    const random = Math.floor(100000 + Math.random() * 900000);
    return `SRC-${year}-${random}`;
  }

  async getById(id: string): Promise<SourcingRequestWithDetails> {
    const record = await this.repo.findById(id);
    if (!record) throw ApiError.notFound('Sourcing request not found');
    return this.toWithDetails(record);
  }

  async listForAdmin(
    filters?: SourcingRequestFilters,
    page = 1,
    limit = 50
  ): Promise<{
    items: SourcingRequestListItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const result = await this.repo.list(filters, page, limit);
    return {
      ...result,
      items: result.items.map((r) => this.toListItem(r)),
    };
  }

  private toListItem(r: any): SourcingRequestListItem {
    return {
      id: r.id,
      requestNumber: r.requestNumber,
      status: r.status,
      make: r.make,
      model: r.model,
      yearFrom: r.yearFrom,
      yearTo: r.yearTo,
      condition: r.condition,
      firstName: r.firstName,
      lastName: r.lastName,
      email: r.email,
      phoneNumber: r.phoneNumber,
      deliveryCity: r.deliveryCity,
      shippingMethod: r.shippingMethod,
      timeline: r.timeline,
      createdAt: r.createdAt,
    };
  }

  private toWithDetails(r: any): SourcingRequestWithDetails {
    return {
      ...this.toListItem(r),
      trim: r.trim,
      budgetUsd: r.budgetUsd,
      exteriorColor: r.exteriorColor,
      anyColor: r.anyColor,
      additionalNotes: r.additionalNotes,
      consentContact: r.consentContact,
      phoneCode: r.phoneCode,
      updatedAt: r.updatedAt,
    };
  }
}
