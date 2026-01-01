import { inject, injectable } from 'inversify';
import bcrypt from 'bcrypt';
import { randomInt } from 'node:crypto';

import prisma from '../db';
import { MailService } from './MailService';
import TokenService from './TokenService';
import { ProfileService } from './ProfileService';
import { ApiError } from '../utils/ApiError';
import { TYPES } from '../config/types';

import { User, UserRole } from '../generated/prisma/client';
import { TokenType } from '../types/customRequest';

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
    fullName?: string;
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

    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        fullName: data.fullName,
        phone: data.phone,
        role: data.role ?? UserRole.BUYER,
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
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    const tokenRecord = await this.tokenService.validateToken(
      token.toString(),
      user.id,
      TokenType.EMAIL
    );

    if (!tokenRecord) {
      throw ApiError.badRequest('Invalid or expired token');
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true },
    });

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
      TokenType.PASSWORD_RESET_EMAIL
    );

    await prisma.token.create({
      data: {
        email,
        token,
        type: TokenType.PASSWORD_RESET_EMAIL,
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
      token.toString(),
      email,
      TokenType.PASSWORD_RESET_EMAIL
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
