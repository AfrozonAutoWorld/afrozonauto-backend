
import { Request, Response } from "express";
import { inject, injectable } from "inversify";
import { TestimonialService } from "../services/TestimonialService";
import { TYPES } from "../config/types";
import { AuthenticatedRequest } from "../types/customRequest";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import { ProfileService } from "../services/ProfileService";
import { AddressService } from "../services/AddressService";
import { AddressType } from "../generated/prisma/enums";

@injectable()
export class TestimonialController {
  constructor(
    @inject(TYPES.TestimonialService) private readonly service: TestimonialService,
    @inject(TYPES.ProfileService)  private readonly profileService: ProfileService,
    @inject(TYPES.AddressService) private addressService: AddressService
  ) { }


  // Get all testimonials with pagination and stats
  getAllTestimonials = asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const isFeatured = req.query.featured ? req.query.featured === 'true' : undefined;

    const data = await this.service.getTestimonialsWithStats(page, limit, isFeatured);

    return res.status(200).json(
      ApiResponse.success(data, "Testimonials retrieved successfully")
    );
  });

  // Get testimonial counts
  getTestimonialCounts = asyncHandler(async (_req: Request, res: Response) => {
    const counts = await this.service.getTestimonialCounts();

    return res.status(200).json(
      ApiResponse.success(counts, "Testimonial counts retrieved")
    );
  });

  // Get grouped testimonials (featured + unfeatured)
  getGroupedTestimonials = asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 6;
    const data = await this.service.getAllTestimonialsGrouped(limit);
    return res.status(200).json(
      ApiResponse.success(data, "Grouped testimonials retrieved")
    );
  });

  // Public API - get testimonials for website
  getPublicTestimonials = asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 10;
    const featuredOnly = req.query.featuredOnly === 'true';

    const testimonials = await this.service.getPublicTestimonials(limit, featuredOnly);

    return res.status(200).json(
      ApiResponse.success({
        testimonials,
        count: testimonials.length
      }, "Testimonials retrieved successfully")
    );
  });

  // Feature/unfeature testimonials
  bulkUpdateFeatureStatus = asyncHandler(async (req: Request, res: Response) => {
    const { ids, action } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json(
        ApiError.badRequest("IDs array is required")
      );
    }

    if (!['feature', 'unfeature', 'toggle'].includes(action)) {
      return res.status(400).json(
        ApiError.badRequest("Action must be 'feature', 'unfeature', or 'toggle'")
      );
    }

    const result = await this.service.bulkUpdateFeatureStatus(ids, action as any);

    // Get updated counts
    const counts = await this.service.getTestimonialCounts();

    return res.status(200).json(
      ApiResponse.success(
        {
          result,
          stats: counts
        },
        `Testimonials ${action}ed successfully`
      )
    );
  });

  // Customer submits testimonial
  create = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json(ApiError.unauthorized('User not authenticated'));
    }
    let validatedBody = req.body
    const userId = req.user.id;

    const profile = await this.profileService.findUserById(userId.toString());
    if (!profile) {
      return res.status(404).json(ApiError.notFound('Profile not found. Please complete your profile first.'));
    }

    const address = await this.addressService.getDefaultAddress(profile.id, AddressType.NORMAL);
    if (!address) {
      return res.status(400).json(ApiError.badRequest('Default address required. Please set a default address.'));
    }

    const files = validatedBody.uploadedFiles || [];
    const customerName = `${profile.firstName} ${profile.lastName}`.trim();

    // 5. Atomic Creation
    const testimonial = await this.service.createFromOrder({
      ...validatedBody,
      files,
      userId,
      customerName,
      customerCity: address.city,
      customerState: address.state,
      customerCountry: address.country,
    });

    return res.status(201).json(ApiResponse.created(testimonial));
  });
  // Admin approves
  approve = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    if (!req.user) {
      return res.status(401).json(
        ApiError.unauthorized('User not authenticated')
      )
    }
    const adminId = req.user.id;
    const result = await this.service.approveTestimonial(id, adminId);
    res.json({ success: true, result });
  });
}
