import { injectable } from 'inversify';
import prisma from '../db';
import {  Prisma, User, UserRole } from '../generated/prisma/client';

@injectable()
export class UserRepository {
  private prisma = prisma;

  async create(data: {
    userID: string;
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }){
    return this.prisma.user.create({
      data,
      include: { profile: true },
    });
  }

  async createUser(
    userData: {
      email: string;
      googleId?: string;
      password?: string;
      role: UserRole;
      verified?: boolean;
    },
    profileData?: {
      firstName?: string;
      lastName?: string;
      photo?: Prisma.FileInfoCreateWithoutProfileInput[];
    }
  ): Promise<User> {
    return this.prisma.user.create({
      data: {
        email: userData.email,
        googleId: userData.googleId,
        role: userData.role,
        emailVerified: userData.verified ?? false,
        passwordHash: userData.password,

        profile: profileData
          ? {
            create: {
              lastName: profileData.lastName,
              firstName: profileData.firstName,
              files: profileData.photo
                ? {
                  createMany: {
                    data: profileData.photo,
                  },
                }
                : undefined,
            },
          }
          : undefined,
      },
      include: {
        profile: {
          include: { files: true },
        },
      },
    });
  }


  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        profile: {
          include: {
            files: true,
          },
        },
      },
    });
  }
  async findByGoogleId(googleId: string) {
    return this.prisma.user.findFirst({
      where: {
        googleId,
        isDeleted: false,
      },
      include: {
        profile: {
          include: { files: true },
        },
      },
    });
  }
  


  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: { profile: true },
    });
  }

  async findAll(skip: number = 0, take: number = 10){
    return this.prisma.user.findMany({
      where: { isDeleted: false },
      include: { profile: true },
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, data: Partial<User>){
    return this.prisma.user.update({
      where: { id },
      data,
      include: { profile: true },
    });
  }

  async updateUserInfo(
    userId: string,
    data: {
      googleId?: string;
      verified?: boolean;
    }
  ){
    return this.prisma.user.update({
      where: { id: userId },
      data: {
                // Only include fields that exist in your schema
                ...(data.googleId !== undefined && { googleId: data.googleId }),
                ...(data.verified !== undefined && { emailVerified: data.verified }),
      },
      include: {
        profile: true,
      },
    });
  }


  async delete(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: { isDeleted: true },
    });
  }

  async count(): Promise<number> {
    return this.prisma.user.count({
      where: { isDeleted: false },
    });
  }
}