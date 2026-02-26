import { injectable } from "inversify";
import prisma from '../db';
import { Testimonial } from '../generated/prisma/client';
import { ITestimonialRepository } from "../validation/interfaces/ITestimonial";


@injectable()
export class TestimonialRepository implements ITestimonialRepository {

  async create(data: any) {
    return prisma.testimonial.create({ data });
  }

  async findApproved(limit = 6) {
    return prisma.testimonial.findMany({
      where: { isApproved: true },
      orderBy: { publishedAt: "desc" },
      take: limit,
    });
  }

  async findFeatured(limit = 6) {
    return prisma.testimonial.findMany({
      where: { isFeatured: true },
      orderBy: { publishedAt: "desc" },
      take: limit,
    });
  }

  async findUnfeatured(limit = 6) {
    return prisma.testimonial.findMany({
      where: { isFeatured: false },
      orderBy: { publishedAt: "desc" },
      take: limit,
    });
  }

  async approve(id: string, adminId: string) {
    return prisma.testimonial.update({
      where: { id },
      data: {
        isApproved: true,
        publishedAt: new Date(),
        approvedBy: adminId,
      },
    });
  }

  async feature(ids: string | string[]): Promise<{ count: number }> {
    const idArray = Array.isArray(ids) ? ids : [ids];
    
    const result = await prisma.testimonial.updateMany({
      where: {
        id: { in: idArray }
      },
      data: {
        isFeatured: true,
      },
    });
    
    return { count: result.count };
  }

  async unfeature(ids: string | string[]): Promise<{ count: number }> {
    const idArray = Array.isArray(ids) ? ids : [ids];

    const result = await prisma.testimonial.updateMany({
      where: {
        id: { in: idArray }
      },
      data: {
        isFeatured: false,
      },
    });
    
    return { count: result.count };
  }

  async featureOrUnfeature(ids: string[], type: "feature" | "unfeature"): Promise<{ count: number }> {
    if (type === "feature") {
      return this.feature(ids);
    } else {
      return this.unfeature(ids);
    }
  }

  /**
   * Get all testimonials with pagination and counts
   */
  async findAllWithPagination(
    page = 1,
    limit = 10,
    isFeatured?: boolean
  ): Promise<{
    testimonials: Testimonial[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    featuredCount: number;
    unfeaturedCount: number;
  }> {
    const skip = (page - 1) * limit;
    
    // Build where clause
    const whereClause: any = {};
    if (isFeatured !== undefined) {
      whereClause.isFeatured = isFeatured;
    }
    
    // Get testimonials
    const [testimonials, total, featuredCount, unfeaturedCount] = await Promise.all([
      prisma.testimonial.findMany({
        where: whereClause,
        orderBy: { publishedAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.testimonial.count({ where: whereClause }),
      prisma.testimonial.count({ where: { isFeatured: true } }),
      prisma.testimonial.count({ where: { isFeatured: false } }),
    ]);
    
    const totalPages = Math.ceil(total / limit);
    
    return {
      testimonials,
      total,
      page,
      limit,
      totalPages,
      featuredCount,
      unfeaturedCount,
    };
  }

  /**
   * Get all counts
   */
  async getCounts(): Promise<{
    total: number;
    featured: number;
    unfeatured: number;
    approved: number;
    pending: number;
  }> {
    const [
      total,
      featured,
      unfeatured,
      approved,
      pending
    ] = await Promise.all([
      prisma.testimonial.count(),
      prisma.testimonial.count({ where: { isFeatured: true } }),
      prisma.testimonial.count({ where: { isFeatured: false } }),
      prisma.testimonial.count({ where: { isApproved: true } }),
      prisma.testimonial.count({ where: { isApproved: false } }),
    ]);
    
    return {
      total,
      featured,
      unfeatured,
      approved,
      pending,
    };
  }

  /**
   * Toggle feature status with proper return
   */
  async toggleFeature(ids: string | string[]): Promise<Testimonial[]> {
    const idArray = Array.isArray(ids) ? ids : [ids];
    
    // First get current testimonials
    const testimonials = await prisma.testimonial.findMany({
      where: {
        id: { in: idArray }
      }
    });
    
    // Update each testimonial
    const updatePromises = testimonials.map(testimonial =>
      prisma.testimonial.update({
        where: { id: testimonial.id },
        data: { isFeatured: !testimonial.isFeatured }
      })
    );
    
    return Promise.all(updatePromises);
  }
}