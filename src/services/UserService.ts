import { injectable, inject } from 'inversify';
import { TYPES } from '../config/types';
import { UserRepository } from '../repositories/UserRepository';
import bcrypt from 'bcrypt';
import { randomBytes } from 'node:crypto';
import { UserRole } from '../generated/prisma/enums';
import prisma from '../db';
import { TokenType } from '../generated/prisma/client';
import { ApiError } from '../utils/ApiError';

@injectable()
export class UserService {
  constructor(
    @inject(TYPES.UserRepository) private userRepository: UserRepository
  ) {}

  async createUser(data: {
    userID?: string;
    email: string;
    role?: UserRole;
    googleId?: string;
    emailVerified?: boolean;
    password: string;
    firstName?: string;
    lastName?: string;
  }) {
    const {
      email,
      role,
      googleId,
      emailVerified,
      password,
      firstName,
      lastName,
    } = data;
  
    const hashedPassword = await this.hashing(password);
  
    return this.userRepository.create({
      email,
      role,
      googleId,
      firstName,
      lastName,
      emailVerified,
      password: hashedPassword,
    });
  }
  

  async getUserById(id: string) {
    return this.userRepository.findById(id);
  }

  async hashing (password: string){
   return await bcrypt.hash(password, 10) 
  }


  async getUserByEmail(email: string) {
    return this.userRepository.findByEmail(email);
  }

  async getAllUsers(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const users = await this.userRepository.findAll(skip, limit);
    const total = await this.userRepository.count();

    return {
      users,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  async updateUser(id: string, data: Partial<any>) {
    return this.userRepository.update(id, data);
  }
  async updateUserPassword(id: string, data: Partial<any>) {
    return await this.userRepository.update(id, {...data, passwordHash: await this.hashing(data.password), });
  }

  async deleteUser(id: string) {
    return this.userRepository.delete(id);
  }

  generateSecurePassword(): string {
    const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const lower = 'abcdefghjkmnpqrstuvwxyz';
    const digits = '23456789';
    const special = '@#$%&*!';
    const all = upper + lower + digits + special;

    // Guarantee at least one of each character class
    const pick = (chars: string) => chars[randomBytes(1)[0] % chars.length];
    const required = [pick(upper), pick(lower), pick(digits), pick(special)];

    const rest = Array.from({ length: 8 }, () => pick(all));
    const combined = [...required, ...rest];

    // Fisher-Yates shuffle using crypto random values
    for (let i = combined.length - 1; i > 0; i--) {
      const j = randomBytes(1)[0] % (i + 1);
      [combined[i], combined[j]] = [combined[j], combined[i]];
    }

    return combined.join('');
  }

  async adminCreateUser(data: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    role?: UserRole;
  }): Promise<{ user: any; password: string; resetToken: number }> {
    const existing = await this.userRepository.findByEmail(data.email);
    if (existing) {
      throw ApiError.conflict('A user with this email already exists');
    }

    const password = this.generateSecurePassword();
    const passwordHash = await this.hashing(password);

    const { randomUUID } = await import('node:crypto');
    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        phone: data.phone,
        role: data.role ?? UserRole.BUYER,
        emailVerified: true,
        googleId: `local_${randomUUID()}`,
        appleId: `local_${randomUUID()}`,
        profile: {
          create: {
            firstName: data.firstName,
            lastName: data.lastName,
          },
        },
      },
      include: { profile: true },
    });

    // Invalidate any old password-reset tokens then create a fresh one
    await prisma.token.updateMany({
      where: { email: data.email, type: TokenType.PASSWORD_RESET, used: false },
      data: { used: true, usedAt: new Date() },
    });

    const { randomInt } = await import('node:crypto');
    const resetToken = randomInt(100000, 1000000);
    await prisma.token.create({
      data: { email: data.email, token: resetToken, type: TokenType.PASSWORD_RESET },
    });

    return { user, password, resetToken };
  }

  getUserByGoogleId(googleId: string) {
    return this.userRepository.findByGoogleId(googleId);
  }


  findById(id: string) {
    return this.userRepository.findById(id);
  }

  updateUserInfo(userId: string, data: any) {
    return this.userRepository.updateUserInfo(userId, data);
  }
}