import { randomInt } from 'node:crypto';
import { inject, injectable } from 'inversify';
import { TokenType, Token, Prisma } from '../generated/prisma/client';
import { TOKEN_EXPIRY_MINUTES } from '../secrets';
import { TYPES } from '../config/types';
import { MailService } from './MailService';
import { ApiError } from '../utils/ApiError';
import prisma from '../db';
import { TokenIdentifier } from '../types/types';

@injectable()
export default class TokenService {
  constructor(
    @inject(TYPES.MailService)
    private readonly mailService: MailService
  ) { }

  /* ----------------------------------------------------
     GENERATE TOKEN
  ---------------------------------------------------- */
  async generateToken(): Promise<number> {
    return randomInt(100000, 1000000);
  }

  /* ----------------------------------------------------
     SEND EMAIL VERIFICATION TOKEN
  ---------------------------------------------------- */
  async sendVerificationToken(userId: string | undefined, email: string) {
    const token = await this.createVerificationToken(
      TokenType.EMAIL,
      userId,
      email
    );
    await this.mailService.sendVerification(email, token);
  }

  /* ----------------------------------------------------
     CREATE / REUSE VERIFICATION TOKEN
  ---------------------------------------------------- */
  async createVerificationToken(
    type: TokenType,
    userId?: string,
    email?: string
  ): Promise<number> {
    if (!userId && !email) {
      throw ApiError.badRequest('userId or email must be provided');
    }

    const OTP_TTL_MS = (parseInt(TOKEN_EXPIRY_MINUTES, 10) || 5) * 60 * 1000;

    // Find latest unused, non-expired token
    const existingToken = await prisma.token.findFirst({
      where: {
        type,
        used: false,
        ...(userId ? { userId } : { email }),
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (existingToken) {
      return existingToken.token;
    }

    const token = await this.generateToken();
    const data: Prisma.TokenCreateInput = {
      token,
      type,
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
      ...(userId && {
        user: {
          connect: { id: userId },
        },
      }),
      ...(email && { email }),
    };

    const created = await prisma.token.create({ data });

    if (!created) {
      throw ApiError.internal('Token saving failed');
    }

    return token;
  }

  /* ----------------------------------------------------
       VALIDATE TOKEN
    ---------------------------------------------------- */
  async validateToken(
    token: number,
    identifier: string | { userId?: string; email?: string },
    type?: TokenType
  ): Promise<Token | null> {
    const notExpired = {
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ],
    };

    // Build identifier condition — string shorthand or object with userId/email
    let identifierCondition: any;
    if (typeof identifier === 'string') {
      identifierCondition = identifier.includes('@')
        ? { email: identifier }
        : { userId: identifier };
    } else {
      const orParts: any[] = [];
      if (identifier.userId) orParts.push({ userId: identifier.userId });
      if (identifier.email) orParts.push({ email: identifier.email });
      identifierCondition = orParts.length === 1 ? orParts[0] : { OR: orParts };
    }

    return prisma.token.findFirst({
      where: {
        token: Number(token),
        ...(type ? { type } : {}),
        used: false,
        AND: [notExpired, identifierCondition],
      },
    });
  }

  /* ----------------------------------------------------
    DELETE TOKENS FOR USER / EMAIL
 ---------------------------------------------------- */

  async deleteToken(tokenIdentifier: {
    userId?: string;
    email?: string;
  }) {
    const { userId, email } = tokenIdentifier;

    if (!userId && !email) {
      throw ApiError.badRequest('Either userId or email must be provided to delete tokens');
    }

    return prisma.token.deleteMany({
      where: {
        ...(userId ? { userId } : {}),
        ...(email ? { email } : {}),
      },
    });
  }

  /* ----------------------------------------------------
     MARK TOKEN AS USED
  ---------------------------------------------------- */
  async updateTokenUsablility(id: string) {
    return prisma.token.update({
      where: { id },
      data: {
        used: true,
        usedAt: new Date(),
      },
    });
  }

  /* ----------------------------------------------------
     INVALIDATE EXISTING TOKENS
  ---------------------------------------------------- */
  // async invalidateExistingTokens(
  //   identifier: string,
  //   type?: TokenType
  // ) {
  //   await prisma.token.updateMany({
  //     where: {
  //       usedAt: null,
  //       ...(type ? { type } : {}),
  //       OR: [
  //         { userId: identifier },
  //         { email: identifier },
  //       ],
  //     },
  //     data: {
  //       used: true,
  //       usedAt: new Date(),
  //     },
  //   });
  // }

  async invalidateExistingTokens(
    userId?: string,
    email?: string,
    type?: TokenType
  ) {
    const whereConditions: any = {
      usedAt: null,
      ...(type ? { type } : {}),
    };

    if (userId) {
      whereConditions.userId = userId;
    } else if (email) {
      whereConditions.email = email;
    } else {
      throw new Error('Either userId or email must be provided');
    }

    await prisma.token.updateMany({
      where: whereConditions,
      data: {
        used: true,
        usedAt: new Date(),
      },
    });
  }

  /* ----------------------------------------------------
     GET LAST USED TOKEN
  ---------------------------------------------------- */

  async getUsedTokenForUser(
    identifier: TokenIdentifier,
    lastUsed: boolean = true
  ): Promise<Token | null> {

    return prisma.token.findFirst({
      where: {
        used: true,
        ...(lastUsed && { usedAt: { not: null } }),
        ...identifier,
      },
      orderBy: [
        { usedAt: 'desc' },
        { createdAt: 'desc' },
      ],
    });
  }

}
