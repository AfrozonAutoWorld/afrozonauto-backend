import { inject, injectable } from "inversify";
import { ITestimonialRepository } from "../validation/interfaces/ITestimonial";
import { TYPES } from "../config/types";
import { ApiError } from "../utils/ApiError";

@injectable()
export class TestimonialService {
  constructor(
    @inject(TYPES.TestimonialRepository)
    private readonly repo: ITestimonialRepository
  ) { }

  async createFromOrder(payload: {
    userId: string;
    orderId?: string;
    rating: number;
    comment: string;
    customerName: string;
    location?: string;
    vehicle: any; // snapshot
  }) {
    return this.repo.create({
      userId: payload.userId,
      orderId: payload.orderId,
      customerName: payload.customerName,
      customerCity: payload.location,
      rating: payload.rating,
      comment: payload.comment,
      vehicleSnapshot: payload.vehicle,
    });
  }

  async getHomepageTestimonials() {
    return this.repo.findApproved(6);
  }

  async approveTestimonial(id: string, adminId: string) {
    return this.repo.approve(id, adminId);
  }

  // Existing method - get featured testimonials
  async getFeaturedTestimonies(limit: number = 10) {
    return this.repo.findFeatured(limit);
  }

  // New method - get testimonials with counts
  async getTestimonialsWithStats(
    page: number = 1,
    limit: number = 10,
    isFeatured?: boolean
  ) {
    return this.repo.findAllWithPagination(page, limit, isFeatured);
  }

  // New method - get only counts
  async getTestimonialCounts() {
    return this.repo.getCounts();
  }

  // New method - get both featured and unfeatured
  async getAllTestimonialsGrouped(limit: number = 6) {
    const [featured, unfeatured, counts] = await Promise.all([
      this.repo.findFeatured(limit),
      this.repo.findUnfeatured(limit),
      this.repo.getCounts()
    ]);

    return {
      featured: {
        testimonials: featured,
        count: counts.featured
      },
      unfeatured: {
        testimonials: unfeatured,
        count: counts.unfeatured
      },
      stats: counts
    };
  }



  // Get testimonials for public API (approved only)
  async getPublicTestimonials(limit: number = 10, featuredOnly: boolean = false) {
    if (featuredOnly) {
      return this.repo.findFeatured(limit);
    }

    // Get all approved testimonials, featured first
    const [featured, regular] = await Promise.all([
      this.repo.findFeatured(limit),
      this.repo.findUnfeatured(limit)
    ]);

    // Combine with featured first
    return [...featured, ...regular].slice(0, limit);
  }

  async featureTestimonials(ids: string[], isFeature: boolean) {
    const type = isFeature ? "feature" : "unfeature";
    return this.repo.featureOrUnfeature(ids, type);
  }

  async bulkUpdateFeatureStatus(
    ids: string[],
    action: "feature" | "unfeature" | "toggle"
  ) {
    switch (action) {
      case "feature":
        return this.repo.feature(ids);
      case "unfeature":
        return this.repo.unfeature(ids);
      case "toggle":
        return this.repo.toggleFeature(ids);
      default:
        throw ApiError.badRequest(`Invalid action: ${action}`);
    }
  }
}
