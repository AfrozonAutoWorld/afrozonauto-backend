import { injectable } from 'inversify';
import { Profile } from '../generated/prisma/client';
import prisma from '../db';
import { ApiError } from '../utils/ApiError';

@injectable()
export class ProfileRepository {


  /* -----------------------------------------------------
     CREATE / UPSERT PROFILE
  ----------------------------------------------------- */
  async create(
    data: Partial<Profile>,
    userId: string
  ): Promise<Profile> {
    try {
      return await prisma.profile.upsert({
        where: { userId },
        update: {
          ...data,
        },
        create: {
          ...data,
          userId,
        },
      });
    } catch (error: any) {
      throw ApiError.internal(`Failed to create profile: ${error.message}`);
    }
  }

  /* -----------------------------------------------------
     FIND BY PROFILE ID
  ----------------------------------------------------- */
  async findById(id: string): Promise<Profile | null> {
    return prisma.profile.findUnique({
      where: { id },
    });
  }

  /* -----------------------------------------------------
     FIND BY USER ID (WITH USER INFO)
  ----------------------------------------------------- */
  async findUserById(userId: string): Promise<Profile | null> {
    return prisma.profile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            email: true,
            phone: true,
          },
        },
      },
    });
  }

  /* -----------------------------------------------------
     UPDATE PROFILE BY USER ID
  ----------------------------------------------------- */
  async updateProfileByUserId(
    userId: string,
    update: Partial<Profile>
  ): Promise<Profile> {
    return prisma.profile.update({
      where: { userId },
      data: update,
    });
  }

  /* -----------------------------------------------------
     UPDATE PROFILE (BY PROFILE ID)
  ----------------------------------------------------- */
  async update(
    id: string,
    data: Partial<Profile>
  ): Promise<Profile> {
    return prisma.profile.update({
      where: { id },
      data,
    });
  }

  /* -----------------------------------------------------
     FIND ALL PROFILES
  ----------------------------------------------------- */
  async findAll(): Promise<Profile[]> {
    return prisma.profile.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  /* -----------------------------------------------------
     SEARCH PROFILES BY NAME
  ----------------------------------------------------- */
  async searchProfilesByName(
    firstName?: string,
    lastName?: string,
    excludeUserId?: string
  ): Promise<Profile[]> {
    if (!firstName && !lastName) {
      throw ApiError.badRequest(
        'Either firstName or lastName must be provided'
      );
    }

    return prisma.profile.findMany({
      where: {
        AND: [
          excludeUserId
            ? { userId: { not: excludeUserId } }
            : {},
          firstName
            ? {
              firstName: {
                contains: firstName,
                mode: 'insensitive',
              },
            }
            : {},
          lastName
            ? {
              lastName: {
                contains: lastName,
                mode: 'insensitive',
              },
            }
            : {},
        ],
      },
      include: {
        user: {
          select: {
            email: true,
            phone: true,
            role: true,
            isActive: true,
          },
        },
      },
      take: 50,
    });
  }

  /* -----------------------------------------------------
   FIND ALL PROFILES
----------------------------------------------------- */
  async delete(id: string): Promise<Profile[]> {
    return prisma.profile.delete({
      where: { id},
    });
  }

}
