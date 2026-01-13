import { inject, injectable } from 'inversify';
import bcrypt from 'bcrypt';
import { randomInt, randomUUID } from 'node:crypto';
import prisma from '../db';
import { MailService } from './MailService';
import TokenService from './TokenService';
import { ProfileService } from './ProfileService';
import { ApiError } from '../utils/ApiError';
import { TYPES } from '../config/types';

import { User, UserRole, TokenType } from '../generated/prisma/client';

type TokenIdentifier =
  | { email: string }
  | { userId: string };

@injectable()
export class AuthService {
  constructor(
    @inject(TYPES.MailService) private mailService: MailService,
    @inject(TYPES.TokenService) private tokenService: TokenService,
    @inject(TYPES.ProfileService) private profileService: ProfileService
  ) {}

  // ============================
  // REGISTER
  // ============================
  async register(data: {
    email: string;
    password: string;
    phone?: string;
    role?: UserRole;
  }): Promise<User> {
    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      throw ApiError.badRequest('User already exists');
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    // Generate unique IDs for googleId and appleId to avoid unique constraint violations
    // MongoDB unique constraints treat null as duplicate, so we use unique values instead
    const uniqueGoogleId = `local_${randomUUID()}`;
    const uniqueAppleId = `local_${randomUUID()}`;

    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        phone: data.phone,
        role: data.role ?? UserRole.BUYER,
        emailVerified: true,
        googleId: uniqueGoogleId,
        appleId: uniqueAppleId,
      },
    });

    // Send verification token
    await this.tokenService.sendVerificationToken(user.id, user.email);

    return user;
  }

  // ============================
  // VERIFY EMAIL
  // ============================
  async verifyUser(email: string, token: number): Promise<boolean> {
    // Test token bypass for development/testing (token: 999999)
    const TEST_TOKEN = 999999;
    const isTestToken = token === TEST_TOKEN;
    const isDevelopment = process.env.NODE_ENV === 'development' || process.env.NODE_ENV !== 'production';

    if (isTestToken && isDevelopment) {
      // In development, test token automatically verifies any email
      // Create a used token record so register endpoint can find it
      try {
        // Check if a used token already exists
        const existingUsedToken = await this.tokenService.getUsedTokenForUser({ email }, true);
        if (existingUsedToken) {
          return true; // Already verified
        }

        // Delete any existing unused tokens for this email (don't use invalidateExistingTokens as it expects userId)
        await prisma.token.deleteMany({
          where: {
            email: email,
            type: TokenType.EMAIL,
            used: false,
          },
        });

        // Create a used token record for test token
        await prisma.token.create({
          data: {
            token: TEST_TOKEN,
            type: TokenType.EMAIL,
            email: email,
            used: true,
            usedAt: new Date(),
          },
        });
      } catch (error: any) {
        // If creation fails, try to find existing used token
        const existingUsedToken = await this.tokenService.getUsedTokenForUser({ email }, true);
        if (!existingUsedToken) {
          // Log the actual error for debugging
          console.error('Test token verification error:', error?.message || error);
          throw ApiError.internal(`Failed to create verification record: ${error?.message || 'Unknown error'}`);
        }
      }
      return true;
    }

    const tokenRecord = await this.tokenService.validateToken(token, { email }, TokenType.EMAIL);

    if (!tokenRecord) {
      throw ApiError.badRequest('Invalid or expired token');
    }


    await this.tokenService.updateTokenUsablility(tokenRecord.id);

    return true;
  }

  // ============================
  // LOGIN
  // ============================
  async login(email: string, password: string): Promise<User> {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    if (!user.emailVerified) {
      await this.tokenService.sendVerificationToken(user.id, user.email);
      throw ApiError.badRequest(
        'Email not verified. A new verification code has been sent.'
      );
    }

    if (!user.isActive || user.isSuspended) {
      throw ApiError.badRequest('Account is suspended');
    }

    if (!user.passwordHash) {
      throw ApiError.badRequest('Password authentication not enabled');
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      throw ApiError.badRequest('Invalid credentials');
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return user;
  }

  // ============================
  // SEND PASSWORD RESET
  // ============================
  async sendResetToken(email: string): Promise<User> {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    const profile = await this.profileService.findUserById(user.id);

    const token = await this.tokenService.generateToken();

    await this.tokenService.invalidateExistingTokens(
      email,
      TokenType.PASSWORD_RESET
    );

    await prisma.token.create({
      data: {
        email,
        token,
        type: TokenType.PASSWORD_RESET,
      },
    });

    await this.mailService.sendPasswordReset(
      email,
      token,
      profile ?? undefined
    );

    return user;
  }

  // ============================
  // RESET PASSWORD
  // ============================
  async resetPassword(
    email: string,
    token: number,
    newPassword: string
  ): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    const tokenRecord = await this.tokenService.validateToken(
      token,
      {email},
      TokenType.PASSWORD_RESET
    );

    if (!tokenRecord) {
      throw ApiError.badRequest('Invalid or expired token');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    await this.tokenService.updateTokenUsablility(tokenRecord.id);

    return true;
  }

  // ============================
  // RESEND VERIFICATION
  // ============================
  async resendVerification(email: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    if (user.emailVerified) {
      throw ApiError.badRequest('Email already verified');
    }

    await this.tokenService.sendVerificationToken(user.id, user.email);

    return true;
  }

  // ============================
  // DELETE USER
  // ============================
  async deleteUser(userId: string): Promise<boolean> {
    await prisma.user.delete({
      where: { id: userId },
    });
    return true;
  }
}
