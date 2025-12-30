import { inject, injectable } from 'inversify';
import { Types } from "mongoose";
import { MailService } from './MailService';
import { TYPES } from '../config/types';
import { randomInt } from 'node:crypto';
import TokenService from './TokenService';
import { TokenType } from '../types/customRequest';
import bcrypt from 'bcrypt';
import { ProfileService } from './ProfileService';
import { ApiError } from '../utils/ApiError';
import prisma from '../db';
import { User, UserRole } from '../generated/prisma/client';

@injectable()
export class AuthService {
  constructor(
    @inject(TYPES.MailService) private mailService: MailService,
    @inject(TYPES.TokenService) private tokenService: TokenService,
    @inject(TYPES.ProfileService) private profileService: ProfileService,
    @inject(TYPES.UserRepository) private userRepository: IUserRepository
  ) { }

  async register(
    userData: Partial<IUserDocument>,
    vendorData?: Partial<IVendor>
  ): Promise<IUserDocument> {
    const existingUser = await this.userRepository.findByEmail(userData.email);
    if (existingUser) throw ApiError.badRequest('user already exist');

    let newUser: IUserDocument;

      newUser = await this.userRepository.create(
        { ...userData, verified: true } as Omit<IUserDocument, 'createdAt' | 'updatedAt'>
      );
    // create user profile
    return newUser;
  }

  async verifyUser(email: string, token: number, registered: boolean = false): Promise<boolean> {
    let user = null;
    //  If verification registered user is required, ensure user exists
    if (registered) {
      user = await this.userRepository.findByEmail(email);
      if (!user) throw ApiError.notFound('User not found');
    }
    // Validate token against userId (if verification) or email (if not verification)
    const identifier = registered ? user!._id.toString() : email;
    const tokenRecord = await this.tokenService.validateToken(token.toString(), identifier);
    if (!tokenRecord) {
      throw ApiError.badRequest('Invalid or expired token');
    }

    // If verification for registered user, mark user as verified
    if (registered) {
      await this.userRepository.verifyUser(user!._id.toString());
      await this.tokenService.deleteToken(identifier);
    } else {
      // await this.tokenService.invalidateExistingTokens(identifier)
      await this.tokenService.updateTokenUsablility(tokenRecord?._id.toString())
    }

    return true;
  }


  async login(email: string, password: string) {
    const user = (await this.userRepository.findByEmail(email));
    if (!user) throw ApiError.notFound('User not found');

    if (!user.verified) {
      await this.tokenService.deleteToken(user?._id.toString());
      const token = await this.tokenService.createVerificationToken(TokenType.EMAIL, user?._id.toString());
      await this.mailService.sendVerification(user.email, Number(token));
      throw ApiError.badRequest('Email not verified. A new verification code has been sent.');
    }

    if (user.isDeleted) {
      throw ApiError.badRequest('Your account has been suspended. Contact support for assistance.');
    }

    const match = await (user as User).comparePassword(password);
    if (!match) throw ApiError.badRequest('Invalid credentials');

    }

    // Update user status to active
    user.status = UserStatus.ACTIVE;
    user.isActive = true;
    await user.save();
    return user;
  }


  async sendResetToken(email: string) {
    const user = await this.userRepository.findByEmail(email);
    if (!user) throw ApiError.notFound('User not found');
  
    const profile = await this.profileService.findUserById(user.id);
  
    const token = await this.tokenService.generateToken();
  
    await this.tokenService.deleteToken(email);
  
    // Prisma version (recommended)
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

  async resetPassword(email: string, token: number, newPassword: string, securityAnswer?: string) {
    const user = await this.userRepository.findByEmail(email);
    if (!user) throw ApiError.notFound('User not found');
    // If securityAnswer was provided, validate it using bcrypt
    if (securityAnswer) {
      // Check if user has security question setup
      if (!user.securityQuestion || !user.securityAnswer) {
        throw ApiError.badRequest('Security question not set up for this user');
      }

      // Use bcrypt to compare the provided answer with the stored hash
      const isSecurityAnswerValid = await bcrypt.compare(securityAnswer, user.securityAnswer);
      if (!isSecurityAnswerValid) {
        throw ApiError.badRequest('Invalid security answer');
      }
    }

    const tokenRecord = await this.tokenService.validateToken(token.toString(), email);
    if (!tokenRecord) return ApiError.badRequest('Invalid token');
    await this.userRepository.updatePassword(user._id.toString(), newPassword);
    await this.tokenService.deleteToken(email);
    return true;
  }
  async tokenValidate(email: string, token: string) {
    const user = await this.userRepository.findByEmail(email);
    if (!user) throw ApiError.notFound('User not found');
    const tokenRecord = await TokenModel.findOne({ user: user._id, token });
    if (!tokenRecord) throw ApiError.badRequest('Invalid token');
    return token
  }

  async resendVerification(email: string) {
    const user = await this.userRepository.findByEmail(email);
    if (!user) throw ApiError.notFound('User not found');
    if (user.verified) throw ApiError.badRequest('Email already verified');

    const token = randomInt(100000, 999999);
    await TokenModel.deleteMany({ user: user._id });
    await new TokenModel({ user: user._id, token }).save();
    await this.mailService.sendVerification(user.email, token);

    return true;
  }

  verifyVendor = async (vendorId: Types.ObjectId) => {
    const vendor = await Vendor.findOne({ _id: vendorId });
    if (!vendor) {
      throw ApiError.notFound('Vendor not found');
    }
    vendor.verified = true;
    await vendor.save();
    return vendor;
  }
  deleteUser = async (vendorUserId: Types.ObjectId) => {
    return await this.userRepository.deleteAccount(vendorUserId);
  }

  logout = async (refreshToken: string) => {
    return await this.userRepository.logout(refreshToken)
  }
}