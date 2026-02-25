import { Testimonial } from "../../generated/prisma/client";

export interface ITestimonialRepository {
  create(data: Partial<Testimonial>): Promise<Testimonial>;
  findApproved(limit?: number): Promise<Testimonial[]>;
  approve(id: string, adminId: string): Promise<Testimonial>;
  
  // Feature/Unfeature operations
  feature(ids: string | string[]): Promise<{ count: number }>;
  unfeature(ids: string | string[]): Promise<{ count: number }>;
  featureOrUnfeature(ids: string[], type: "feature" | "unfeature"): Promise<{ count: number }>;
  
  // Get testimonials with counts
  findFeatured(limit?: number): Promise<Testimonial[]>;
  findUnfeatured(limit?: number): Promise<Testimonial[]>;
  findAllWithPagination(page?: number, limit?: number, isFeatured?: boolean): Promise<{
    testimonials: Testimonial[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    featuredCount: number;
    unfeaturedCount: number;
  }>;
  
  // Get counts
  getCounts(): Promise<{
    total: number;
    featured: number;
    unfeatured: number;
    approved: number;
    pending: number;
  }>;
  
  // Toggle
  toggleFeature(ids: string | string[]): Promise<Testimonial[]>;
}
