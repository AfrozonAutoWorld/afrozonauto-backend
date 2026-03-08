import { Response } from 'express';
import { SourcingRequestService } from '../services/SourcingRequestService';
import { MailService } from '../services/MailService';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { TYPES } from '../config/types';
import { inject, injectable } from 'inversify';
import { AuthenticatedRequest } from '../types/customRequest';
import { SourcingRequestStatus } from '../generated/prisma/client';

@injectable()
export class SourcingRequestController {
  constructor(
    @inject(TYPES.SourcingRequestService)
    private readonly service: SourcingRequestService,
    @inject(TYPES.MailService)
    private readonly mailService: MailService
  ) {}

  create = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;
    const dto = req.body;
    const created = await this.service.create(dto, userId?.toString());

    // Email failure should not cause failure of the request.
    this.mailService
      .sendSourcingRequestConfirmation(created.email, created.requestNumber, created.firstName)
      .catch((err) => {
        console.error('Failed to send sourcing request confirmation email:', err);
      });

    return res.status(201).json(
      ApiResponse.success(created, 'Sourcing request submitted successfully. We will contact you within 48 hours.')
    );
  });

  listForAdmin = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const status = req.query.status as SourcingRequestStatus | undefined;
    const page = Math.max(1, parseInt(String(req.query.page), 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit), 10) || 20));

    const filters = status && Object.values(SourcingRequestStatus).includes(status) ? { status } : undefined;
    const result = await this.service.listForAdmin(filters, page, limit);

    return res.status(200).json(ApiResponse.success(result, 'Sourcing requests retrieved successfully'));
  });

  getById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const request = await this.service.getById(id);
    return res.status(200).json(ApiResponse.success(request, 'Sourcing request retrieved successfully'));
  });
}
