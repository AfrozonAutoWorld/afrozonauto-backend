import { Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import passport from 'passport';
import { AuthService } from '../services/AuthService';
import { TYPES } from '../config/types';
import Jtoken from '../middleware/Jtoken';
import prisma from '../db';
import { DocumentName, UserRole, } from '../generated/prisma/client';
import { UserService } from '../services/UserService';
import TokenService from '../services/TokenService';
import { MailService } from '../services/MailService';
import { ProfileService } from '../services/ProfileService';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import loggers from '../utils/loggers';
import oauthConfig from '../config/oauth.config';
import { GOOGLE_CLIENT_ID, NODE_ENV } from '../secrets';
import { GoogleAuthService } from '../services/GoogleAuthService';
import { UserRepository } from '../repositories/UserRepository';
import { AppleAuthService } from '../services/AppleAuthService';
import { container } from '../config/inversify.config';

@injectable()
export class AuthController {
  constructor(
    @inject(TYPES.AuthService) private authService: AuthService,
    @inject(TYPES.UserService) private userService: UserService,
    @inject(TYPES.ProfileService) private profileService: ProfileService,
    @inject(TYPES.AppleAuthService) private appleAuth: AppleAuthService,
    @inject(TYPES.MailService) private mailService: MailService,
    @inject(TYPES.TokenService) private tokenService: TokenService,
    @inject(TYPES.UserRepository) private userRepo: UserRepository,
    @inject(TYPES.GoogleAuthService) private googleAuthService: GoogleAuthService,
    @inject(TYPES.Jtoken) private jtoken: Jtoken,
  ) { }

  checkUser = asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json(
        ApiError.badRequest('Email address is required')
      )
    }

    const user = await this.userService.getUserByEmail(email);

    if (user) {
      return res.status(400).json(
        ApiError.badRequest('User already exists')
      )
    }

    await this.tokenService.sendVerificationToken(undefined, email);
    return res.json(new ApiResponse(200, { email }, 'Verification token sent to email'));
  });

  sendRecoveryEmailToken = asyncHandler(async (req: Request, res: Response) => {
    const { recoveryEmail } = req.body;

    if (!recoveryEmail) {
      return res.status(400).json(
        ApiError.badRequest('Recovery email address is required')
      )
    }

    await this.tokenService.sendVerificationToken(undefined, recoveryEmail);

    return res.json(new ApiResponse(200, { recoveryEmail }, 'Verification token sent to recovery email'));
  });

  verify = asyncHandler(async (req: Request, res: Response) => {
    const { email, token } = req.body;

    if (!email || !token) {
      return res.status(400).json(ApiError.badRequest('Email and token are required'))
    }
    await this.authService.verifyUser(email, token);

    return res.json(new ApiResponse(200, null, 'Email verified successfully'));
  });

  register = asyncHandler(async (req: Request, res: Response) => {
    const { firstName, lastName, ...value } = req.body;

    if (!value.email) {
      return res.status(400).json(ApiError.badRequest('Email is required'))
    }

    const validateTokenVerification = await this.tokenService.getUsedTokenForUser(value.email);
    console.log(validateTokenVerification)
    if (!validateTokenVerification) {
      return res.status(400).json(ApiError.badRequest('Please complete token validation for your account'))
    }


    const user = await this.authService.register(value);
    await this.profileService.updateProfileByUserId(user.id.toString(), { firstName, lastName });

    if (!user) {
      throw ApiError.internal('User registration failed');
    }

    await this.tokenService.deleteToken(value.email);
    res.status(201).json(new ApiResponse(201, { success: true }, 'Registration successful'));
  });


  registerFinalization = asyncHandler(async (req: Request, res: Response) => {
    const { email, ...others } = req.body;

    if (!email) {
      throw ApiError.badRequest('Email is required');
    }
    const user = await this.userService.getUserByEmail(email);

    if (!user) {
      throw ApiError.notFound('User does not exist');
    }

    const userUpdated = await this.userService.updateUserInfo(user.id, { email, ...others });

    if (!userUpdated) {
      throw ApiError.internal('Failed to update user information');
    }

    const { passwordHash, ...safeUser } = userUpdated;

    res.json(new ApiResponse(200, { user: safeUser }, 'User information updated successfully'));
  });


  login = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json(ApiError.badRequest('Email and password are required'));
    }

    const userLogged = await this.authService.login(email, password);
    const { passwordHash: pass, ...user } = userLogged;

    const jtoken = new Jtoken();
    const { accessToken, refreshToken } = await jtoken.createToken({
      email: user.email,
      role: user.role,
      id: user.id.toString()
    });


    res.json(new ApiResponse(200, {
      user: { ...user, online: true },
      accessToken,
      refreshToken
    }, 'Login successful'));
  });


  sendReset = asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;

    if (!email) {
      throw ApiError.badRequest('Email is required');
    }

    const user = await this.authService.sendResetToken(email);
    res.json(new ApiResponse(200, {
    }, 'Reset token sent to email'));
  });

  resetPassword = asyncHandler(async (req: Request, res: Response) => {
    const { email, token, newPassword } = req.body;

    if (!email || !token || !newPassword) {
      return res.status(400).json(ApiError.badRequest('Email, token, and new password are required'))
    }

    await this.authService.resetPassword(email, token, newPassword);

    return res.json(new ApiResponse(200, null, 'Password reset successful'));
  });

  tokenValidation = asyncHandler(async (req: Request, res: Response) => {
    const { email, token } = req.body;

    if (!email || !token) {
      throw ApiError.badRequest('Email and token are required');
    }

    const userExist = await this.userService.getUserByEmail(email);

    if (!userExist) {
      return res.status(400).json(ApiError.notFound('User does not exist'))
    }

    const tokenValid = await this.tokenService.validateToken(token.toString(), email);

    return res.json(new ApiResponse(200, {
      tokenValid,
    }, 'Token validation completed'));
  });


  refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const refreshToken = req.body.token;

    if (!refreshToken) {
      return res.status(400).json(ApiError.badRequest('Refresh token is required'))
    }

    // Get Jtoken instance from container
    const jtoken = container.get<Jtoken>(TYPES.Jtoken);
    const refreshResult = await jtoken.refreshAccessToken(refreshToken);

    if (!refreshResult) {
      return res.status(400).json(ApiError.unauthorized("Invalid or expired refresh token"))
    }

    // Return the new access token and user data
    return res.status(200).json(
      ApiResponse.success(
        {
          accessToken: refreshResult.accessToken,
          refreshToken: refreshResult.refreshToken,
          user: refreshResult.user
        },
        "Token refreshed successfully"
      )
    );
  });

  /**
   * Google login using ID token
  */
  verifyGoogleToken = asyncHandler(async (req: Request, res: Response) => {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json(ApiError.badRequest("Missing authorization code"))
    }

    const { tokens } = await oauthConfig.getToken(code);
    oauthConfig.setCredentials(tokens);

    if (!tokens.id_token) {
      throw ApiError.unauthorized("Failed to get Google ID token");
    }

    const ticket = await oauthConfig.verifyIdToken({
      idToken: tokens.id_token,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload?.email) {
      return res.status(400).json(ApiError.unauthorized("Google account has no email"))
    }

    const {
      email,
      sub: googleId,
      picture,
      given_name,
      family_name,
    } = payload;

    let user = await this.userService.getUserByEmail(email);

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          googleId,
          role: UserRole.BUYER,
          emailVerified: true,

          profile: {
            create: {
              firstName: given_name ?? "",
              lastName: family_name ?? "",
              files: picture
                ? {
                  create: {
                    url: picture,
                    fileSize: 1024,
                    fileType: "image",
                    format: "jpeg",
                    publicId: googleId,
                    imageName: "google-profile-photo",
                    documentName: DocumentName.storeLogo,
                  },
                }
                : undefined,
            },
          },
        },
        include: {
          profile: { include: { files: true } },
        },
      });
    }

    if (!user) {
      return res.status(503).json(
        ApiError.internal("User creation failed")
      )
    }

    const jtoken = container.get<Jtoken>(TYPES.Jtoken);
    const { accessToken, refreshToken } = await jtoken.createToken({
      email: user.email,
      role: user.role,
      id: user.id,
    });

    return res.status(200).json({
      status: true,
      message: "Google Login successful",
      user,
      accessToken,
      refreshToken,
    });
  });


  /**
   * Initiate Apple Sign-In flow
   */
  initiateAppleSignIn = asyncHandler(async (req: Request, res: Response) => {
    try {
      const state = require('crypto').randomBytes(16).toString('hex');

      // Store state in secure HTTP-only cookie
      res.cookie('apple_auth_state', state, {
        httpOnly: true,
        secure: NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 10 * 60 * 1000 // 10 minutes
      });

      const authUrl = this.appleAuth.getAuthorizationUrl(state);

      return res.status(200).json({
        success: true,
        authUrl
      });
    } catch (error) {
      loggers.error('Error initiating Apple Sign-In:', error);
      throw error;
    }
  })

}