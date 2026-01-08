import { randomInt } from 'node:crypto';
import { inject, injectable } from 'inversify';
import { PrismaClient, TokenType, Token, Prisma } from '../generated/prisma/client';
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



    // Find latest unused token
    const existingToken = await prisma.token.findFirst({
      where: {
        type,
        used: false,
        ...(userId
          ? { userId }
          : { email }),
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
    identifier: TokenIdentifier,
    type?: TokenType
  ): Promise<Token | null> {
    // return prisma.token.findFirst({
    //   where: {
    //     token: Number(token),
    //     ...(type ? { type } : {}),
    //     OR: [
    //       { userId: identifier },
    //       { email: identifier },
    //     ],
    //   },
    // });

    return prisma.token.findFirst({
      where: {
        token: Number(token),
        type,
        used: false,
        ...identifier,
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
  async invalidateExistingTokens(
    identifier: string,
    type?: TokenType
  ) {
    await prisma.token.updateMany({
      where: {
        usedAt: null,
        ...(type ? { type } : {}),
        OR: [
          { userId: identifier },
          { email: identifier },
        ],
      },
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
