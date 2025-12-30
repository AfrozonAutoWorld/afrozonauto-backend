import { injectable } from 'inversify';
import prisma from '../db';
import { User } from  '../generated/prisma/client';

@injectable()
export class UserRepository {
  private prisma = prisma ;

  async create(data: {
    userID: string;
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }): Promise<User> {
    return this.prisma.user.create({
      data,
      include: { profile: true },
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        profile: true,
        orders: true,
      },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
      include: { profile: true },
    });
  }

  async findAll(skip: number = 0, take: number = 10): Promise<User[]> {
    return this.prisma.user.findMany({
      where: { isDeleted: false },
      include: { profile: true },
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data,
      include: { profile: true },
    });
  }

  async delete(id: string): Promise<User> {
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