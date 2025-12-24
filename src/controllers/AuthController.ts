import { Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import passport from 'passport';
import { AuthService } from '../services/AuthService';
import { TYPES } from '../config/types';
import Jtoken from '../middleware/Jtoken';
import { AuthenticatedRequest, TokenType } from '../types/customRequest';
import { UserModel, UserRole, UserStatus } from '../models/User';
import { SessionService } from '../services/SessionService';
import { ActivityLogService } from '../services/ActivityLogService';
import { ActivityIcon, ActivityType, AlertLevel } from '../models/ActivityLog';
import { UserService } from '../services/UserService';
import TokenService from '../services/TokenService';
import { MailService } from '../services/MailService';
import { ProfileService } from '../services/ProfileService';
import { VendorService } from '../services/VendorService';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import loggers from '../utils/loggers';
import oauthConfig from '../config/oauth.config';
import { GOOGLE_CLIENT_ID, FRONTEND_URL, NODE_ENV } from '../secrets';
import Profile from '../models/Profile';
import { WalletService } from '../services/WalletService';
import { GoogleAuthService } from '../services/GoogleAuthService';
import { decryptData, encryptData } from '../utils/encryption';
import JwtAuth from "../middleware/Jtoken"
import { Types } from 'mongoose';
import { IUserRepository } from '../interfaces/IUserRepository';
import { log } from 'console';
import { AppleAuthService } from '../services/AppleAuthService';

@injectable()
export class AuthController {
  constructor(
    @inject(TYPES.AuthService) private authService: AuthService,
    @inject(TYPES.UserService) private userService: UserService,
    @inject(TYPES.ProfileService) private profileService: ProfileService,
    @inject(TYPES.AppleAuthService) private appleAuth: AppleAuthService,
    @inject(TYPES.VendorService) private vendorService: VendorService,
    @inject(TYPES.MailService) private mailService: MailService,
    @inject(TYPES.TokenService) private tokenService: TokenService,
    @inject(TYPES.ActivityLogService) private activityService: ActivityLogService,
    @inject(TYPES.UserRepository) private userRepo: IUserRepository,
    @inject(TYPES.WalletService) private walletService: WalletService,
    @inject(TYPES.GoogleAuthService) private googleAuthService: GoogleAuthService,
    @inject(TYPES.SessionService) private sessionService: SessionService
  ) { }

  checkUser = asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;

    if (!email) {
      throw ApiError.badRequest('Email address is required');
    }

    const user = await this.userService.getUserByEmail(email);

    if (user) {
      return ApiError.badRequest('User already exists');
    }

    await this.tokenService.sendVerificationToken(null, email);

    res.json(new ApiResponse(200, { email }, 'Verification token sent to email'));
  });

  sendRecoveryEmailToken = asyncHandler(async (req: Request, res: Response) => {
    const { recoveryEmail } = req.body;

    if (!recoveryEmail) {
      throw ApiError.badRequest('Recovery email address is required');
    }

    await this.tokenService.sendVerificationToken(null, recoveryEmail);

    res.json(new ApiResponse(200, { recoveryEmail }, 'Verification token sent to recovery email'));
  });

  verify = asyncHandler(async (req: Request, res: Response) => {
    const { email, token } = req.body;

    if (!email || !token) {
      throw ApiError.badRequest('Email and token are required');
    }
    await this.authService.verifyUser(email, token);

    res.json(new ApiResponse(200, null, 'Email verified successfully'));
  });

  register = asyncHandler(async (req: Request, res: Response) => {
    const { firstName, lastName, ...value } = req.body;

    if (!value.email) {
      throw ApiError.badRequest('Email is required');
    }

    const validateTokenVerification = await this.tokenService.getUsedTokenForUser(value.email);
    console.log(validateTokenVerification)
    if (!validateTokenVerification) {
      throw ApiError.badRequest('Please complete token validation for your account');
    }


    const user = await this.authService.register(value);
    await this.profileService.updateProfileByUserId(user._id.toString(), { firstName, lastName });

    if (!user) {
      throw ApiError.internal('User registration failed');
    }

    await this.tokenService.deleteToken(value.email);

    await this.activityService.logActivity({
      title: 'User Registration',
      description: `${user.email} registered on the platform`,
      activityType: ActivityType.CUSTOMER_REGISTRATION,
      user: user._id,
      metadata: {
        alertLevel: AlertLevel.SUCCESS,
      },
      icon: ActivityIcon.USER_PLUS
    });
    res.status(201).json(new ApiResponse(201, { success: true }, 'Registration successful'));
  });
  registerVendor = asyncHandler(async (req: Request, res: Response) => {
    const { firstName, lastName, dob, ...value } = req.body;

    if (!value.email) {
      throw ApiError.badRequest('Email is required');
    }

    const validateTokenVerification = await this.tokenService.getUsedTokenForUser(value.email);
    console.log(validateTokenVerification)
    if (!validateTokenVerification) {
      throw ApiError.badRequest('Please complete token validation for your account');
    }


    const user = await this.authService.register({ ...value, role: UserRole.VENDOR });
    await this.profileService.updateProfileByUserId(user._id.toString(), { firstName, lastName, dob});

    if (!user) {
      throw ApiError.internal('User registration failed');
    }

    await this.tokenService.deleteToken(value.email);

    await this.activityService.logActivity({
      title: 'Vendor Registration',
      description: `${user.email} registered on the platform`,
      activityType: ActivityType.CUSTOMER_REGISTRATION,
      user: user._id,
      metadata: {
        alertLevel: AlertLevel.SUCCESS,
      },
      icon: ActivityIcon.USER_PLUS
    });
    return res.status(201).json(new ApiResponse(201, { success: true }, 'Registration successful'));
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

    const userUpdated = await this.userService.updateUserInfo(user._id, { email, ...others });

    if (!userUpdated) {
      throw ApiError.internal('Failed to update user information');
    }

    const { password, securityAnswer, hint, ...safeUser } = userUpdated.toObject();

    res.json(new ApiResponse(200, { user: safeUser }, 'User information updated successfully'));
  });

  registerSecurityQuestions = asyncHandler(async (req: Request, res: Response) => {
    const { email, ...others } = req.body;
    const user = await this.userService.getUserByEmail(email);

    if (!user) {
      throw ApiError.notFound('User does not exist');
    }

    const userUpdated = await this.userService.updateUserInfo(user._id, { ...others });

    if (!userUpdated) {
      throw ApiError.internal('Failed to update user information');
    }
    const { password, securityAnswer, hint, ...safeUser } = userUpdated.toObject();

    res.json(new ApiResponse(200, { user: safeUser }, 'Security information updated successfully'));
  });

  registerSecurityInfo = asyncHandler(async (req: Request, res: Response) => {
    const { email, token, recoveryEmail, ...others } = req.body;

    if (!email || !token || !recoveryEmail) {
      throw ApiError.badRequest('Email, token, and recovery email are required');
    }

    const user = await this.userService.getUserByEmail(email);

    if (!user) {
      throw ApiError.notFound('User does not exist');
    }

    await this.authService.verifyUser(recoveryEmail, token);

    const tokenUsed = await this.tokenService.getUsedTokenForUser(recoveryEmail, false);
    if (!tokenUsed) {
      throw ApiError.badRequest('No valid token found');
    }

    if (tokenUsed.token != token) {
      throw ApiError.badRequest('Invalid or incorrect token');
    }

    const userUpdated = await this.userService.updateUserInfo(user._id, { email, recoveryEmail, ...others });

    if (!userUpdated) {
      throw ApiError.internal('Failed to update user information');
    }

    await this.tokenService.deleteToken(recoveryEmail);

    const { password, securityAnswer, hint, ...safeUser } = userUpdated.toObject();

    res.json(new ApiResponse(200, { user: safeUser }, 'Security information updated successfully'));
  });

  registerAdmin = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (req.user.role !== UserRole.SUPER_ADMIN) {
      throw ApiError.forbidden('Only super admin can register an admin');
    }

    const user = await this.authService.register({ ...req.body, role: UserRole.ADMIN });

    if (!user) {
      throw ApiError.internal('Admin registration failed');
    }

    await this.activityService.logActivity({
      title: 'New Admin Registration',
      description: `${user.email} registered on the platform`,
      activityType: ActivityType.ADMIN_REGISTRATION,
      user: req.user._id,
      icon: ActivityIcon.USER_PLUS,
    });

    res.status(201).json(new ApiResponse(201, { user }, 'Admin registration successful'));
  });

  registerVendorBussinessInfo = asyncHandler(async (req: Request, res: Response) => {
    const {
      storeName,
      storeDescription,
      taxId,
      address,
      website,
      nin,
      categories,
      uploadedFiles,
      email
    } = req.body;

    // get user by email
    const user = await this.userService.getUserByEmail(email);
    if (!user) {
      return res.status(500).json(
        ApiError.notFound('invalid user credentials')
      )
    }
    const getFilesByDocumentName = (name: string) =>
      uploadedFiles?.filter((f: any) => f.documentName?.includes(name)) || [];

    const vendor = await this.vendorService.createVendor(
      {
        storeName,
        storeDescription,
        taxId,
        website,
        categories,
        user: user?._id,
        logo: getFilesByDocumentName('storeLogo'),
        businessRegistrationFiles: getFilesByDocumentName('businessRegistration'),
        vendorNINFiles: getFilesByDocumentName('vendorNIN')
      }, { ...address, userId: user?._id }, nin
    );

    if (!vendor) {
      return res.status(500).json(
        ApiError.internal('Vendor registration failed')
      )
    }

    await this.activityService.logActivity({
      title: 'New Vendor Registration',
      description: `${vendor.storeName} registered on the platform`,
      activityType: ActivityType.VENDOR_REGISTRATION,
      user: user?._id,
      icon: ActivityIcon.USER_PLUS,
    });

    res.status(201).json(new ApiResponse(201, { vendor }, 'Vendor registered successfully'));
  });

  registerVendorFully = asyncHandler(async (req: Request, res: Response) => {
    const {
      email,
      phoneNumber,
      password,
      storeName,
      storeDescription,
      taxId,
      address,
      website,
      categories,
      uploadedFiles
    } = req.body;

    if (!email || !password) {
      throw ApiError.badRequest('Email and password are required');
    }

    const getFilesByDocumentName = (name: string) =>
      uploadedFiles?.filter((f: any) => f.documentName?.includes(name)) || [];

    const user = await this.authService.register(
      { email, phoneNumber, password },
      {
        storeName,
        storeDescription,
        taxId,
        address,
        website,
        categories,
        logo: getFilesByDocumentName('storeLogo'),
        businessRegistrationFiles: getFilesByDocumentName('businessRegistration'),
        vendorNINFiles: getFilesByDocumentName('vendorNIN')
      }
    );

    if (!user) {
      throw ApiError.internal('Vendor registration failed');
    }

    await this.activityService.logActivity({
      title: 'New Vendor Registration',
      description: `${user.email} registered on the platform`,
      activityType: ActivityType.VENDOR_REGISTRATION,
      user: user._id,
      icon: ActivityIcon.USER_PLUS,
    });

    res.status(201).json(new ApiResponse(201, { user }, 'Vendor registered successfully'));
  });

  login = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json(ApiError.badRequest('Email and password are required'));
    }

    const userLogged = await this.authService.login(email, password);
    const { password: pass, ...user } = userLogged.toJSON();

    const jtoken = new Jtoken();
    const { accessToken, refreshToken } = await jtoken.createToken({
      email: user.email,
      role: user.role,
      _id: user._id.toString()
    });

    const [wallet] = await Promise.all([
      this.walletService.createOrGetWallet(user._id, user),
      this.sessionService.handleUserLogin(
        userLogged._id,
        {
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'] || 'unknown',
          token: refreshToken,
        }
      ),
      this.activityService.logActivity({
        title: 'User Login',
        description: `${userLogged.email} logged in to the platform`,
        activityType: ActivityType.LOGIN,
        user: userLogged._id,
      })
    ]);
    res.json(new ApiResponse(200, {
      user: { ...user, online: true, status: UserStatus.ACTIVE },
      wallet,
      accessToken,
      refreshToken
    }, 'Login successful'));
  });

  getEmailAttachToRecoveryEmail = asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json(ApiError.badRequest('Recovery email is required'));
    }

    const users = await this.userService.getUsersByRecoveryEmail(email);

    if (!users || users.length === 0) {
      throw ApiError.notFound('No accounts found with this recovery email');
    }

    const attachedEmails = users.map(user => ({
      email: user.email,
      userID: user.userID
    }));

    res.json(new ApiResponse(200, {
      count: attachedEmails.length,
      accounts: attachedEmails
    }, 'Accounts found successfully'));
  });

  sendTokenForEmailRecovery = asyncHandler(async (req: Request, res: Response) => {
    const { email, firstName, lastName } = req.body;

    if (!email) {
      throw ApiError.badRequest('Email is required');
    }

    if (!firstName || !lastName) {
      throw ApiError.badRequest('First name and last name are required');
    }

    // Get users with profile populated
    const users = await this.userService.getUsersByRecoveryEmail(email);

    if (!users || users.length === 0) {
      throw ApiError.notFound('No accounts found with this recovery email');
    }

    // Check that at least one user's profile matches (even if first/last name are swapped)
    const matchedUser = users.find((user) => {
      if (!user.profile) return false;

      const dbFirst = user.profile.firstName?.toLowerCase();
      const dbLast = user.profile.lastName?.toLowerCase();
      const inputFirst = firstName.toLowerCase();
      const inputLast = lastName.toLowerCase();

      return (
        (dbFirst === inputFirst && dbLast === inputLast) || // Normal match
        (dbFirst === inputLast && dbLast === inputFirst)   // Swapped match
      );
    });

    if (!matchedUser) {
      throw ApiError.badRequest(
        'First name and last name do not match any account with this recovery email'
      );
    }

    // Create token linked to recovery email
    const token = await this.tokenService.createVerificationToken(
      TokenType.ACCOUNT_RECOVERY,
      null,
      email
    );

    await this.mailService.accountRecovery(email, token);

    res.json(new ApiResponse(200, null, 'Recovery token sent to email'));
  });

  validateTokenEmailRecovery = asyncHandler(async (req: Request, res: Response) => {
    const { token, email } = req.body;

    if (!email || !token) {
      throw ApiError.badRequest('Email and token are required');
    }

    const tokenValid = await this.tokenService.validateToken(token, email);

    if (!tokenValid) {
      throw ApiError.badRequest('Invalid token');
    }


    const users = await this.userService.getUsersByRecoveryEmail(email);

    if (!users || users.length === 0) {
      throw ApiError.notFound('No accounts found with this recovery email');
    }


    const attachedEmails = users.map(user => ({
      email: user.email,
      userID: user.userID
    }));

    // delete the token
    await this.tokenService.deleteToken(email)

    return res.json(new ApiResponse(200, {
      count: attachedEmails.length,
      accounts: attachedEmails
    }, 'Token validated successfully'));
  });

  sendReset = asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;

    if (!email) {
      throw ApiError.badRequest('Email is required');
    }

    const user = await this.authService.sendResetToken(email);

    await this.activityService.logActivity({
      title: 'Password Reset Request',
      description: `${user?.email} requested password reset`,
      activityType: ActivityType.PASSWORD_RESET,
      user: user?._id
    });

    res.json(new ApiResponse(200, {
      hasSecurityQuestion: Boolean(user?.securityQuestion),
      hasRecoveryEmail: Boolean(user?.recoveryEmail),
      hint: user?.hint,
      securityQuestion: user?.securityQuestion,
    }, 'Reset token sent to email'));
  });

  resetPassword = asyncHandler(async (req: Request, res: Response) => {
    const { email, token, newPassword, securityAnswer } = req.body;

    if (!email || !token || !newPassword) {
      throw ApiError.badRequest('Email, token, and new password are required');
    }

    await this.authService.resetPassword(email, token, newPassword, securityAnswer);

    res.json(new ApiResponse(200, null, 'Password reset successful'));
  });

  tokenValidation = asyncHandler(async (req: Request, res: Response) => {
    const { email, token } = req.body;

    if (!email || !token) {
      throw ApiError.badRequest('Email and token are required');
    }

    const userExist = await this.userService.getUserByEmail(email);

    if (!userExist) {
      throw ApiError.notFound('User does not exist');
    }

    const tokenValid = await this.tokenService.validateToken(token.toString(), email);

    res.json(new ApiResponse(200, {
      tokenValid,
      hasRecoveryEmail: Boolean(userExist?.recoveryEmail),
      hasSecurityQuestion: Boolean(userExist?.securityQuestion),
      hint: userExist?.hint,
      securityQuestion: userExist?.securityQuestion,
    }, 'Token validation completed'));
  });

  logout = asyncHandler(async (req: Request, res: Response) => {
    const refreshToken = req.body.token || req.cookies.refreshToken;

    if (!refreshToken) {
      throw ApiError.badRequest('Refresh token is required');
    }

    const result = await this.authService.logout(refreshToken);

    res.json(new ApiResponse(200, { userId: result.userId }, 'Logout successful'));
  });
  refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const refreshToken = req.body.token;

    if (!refreshToken) {
      throw ApiError.badRequest('Refresh token is required');
    }

    const jtoken = new Jtoken();
    const refreshResult = await jtoken.refreshAccessToken(refreshToken);

    if (!refreshResult) {
      throw ApiError.unauthorized("Invalid or expired refresh token");
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
      return res.status(400).send("Missing authorization code");
    }
    try {
      // Exchange authorization code for tokens
      const { tokens } = await oauthConfig.getToken(code);
      oauthConfig.setCredentials(tokens);
      const tokenId = tokens.id_token;

      if (!tokenId) {
        throw ApiError.unauthorized("Failed to get token from Google during code exchange");
      }

      const ticket = await oauthConfig.verifyIdToken({
        idToken: tokenId,
        audience: GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      const { email, name, picture, id: googleId, given_name, family_name } = payload as any;
      if (!email) throw ApiError.unauthorized("Invalid Google token: missing email");

      // Find or create user
      let user = await this.userService.getUserByEmail(email);
      if (!user) {
        // create profile
        let profile = await Profile.create(
          {
            firstName: given_name,
            lastName: family_name,
            photo: [{
              url: picture,
              format: this.extractExtension(picture),
              fileSize: 1024,
              fileType: this.extractExtension(picture),
              imageName: "profile image",
              documentName: "profile"
            }]
          }
        )
        //connect the profile to a user
        user = new UserModel(
          {
            email,
            googleId,
            verified: true,
            status: UserStatus.ACTIVE,
            role: UserRole.CUSTOMER,
            profile: profile._id
          }
        );
        user.save()
      }
      const jtoken = new Jtoken();
      const { accessToken, refreshToken } = await jtoken.createToken({
        email: user.email,
        role: user.role,
        _id: user._id.toString()
      });
      const { password, securityAnswer, ...safeUser } = user.toObject();

      // const sessionInfo = await user.addLoginSession(req.ip, req.headers['user-agent']);
      return res.status(200).json({
        status: true,
        message: 'Google Login successful',
        user: safeUser,
        accessToken,
        refreshToken
      });
    } catch (error: any) {
      loggers.error("Google auth error:", error);
      return res.status(error.statusCode || 400).json(
        ApiError.badRequest(error.message || "Google authentication failed")
      );
    }
  })

  /**
  * Initiate Google OAuth flow
  */
  authenticate = (req: Request, res: Response, next: any) => {
    // Get redirect URLs from query
    const { successRedirect, failureRedirect, platform } = req.query;
    if (!successRedirect || !failureRedirect) {
      return res.status(400).json(
        ApiError.badRequest("both successRedirect and failureRedirect are required",
          {
            successRedirect: "required",
            failureRedirect: "required"
          }
        )
      )
    }

    const state = encodeURIComponent(
      JSON.stringify({
        successRedirect: encodeURIComponent(successRedirect as string),
        failureRedirect: encodeURIComponent(failureRedirect as string),
        platform: typeof platform === 'string' ? platform : 'web',
      })
    );

    passport.authenticate('google', {
      scope: ['profile', 'email'],
      session: false,
      state,
    })(req, res, next);
  };

  /**
   * Handle Google OAuth callback (Universal)
   */
  handleCallback = (req: Request, res: Response, next: any) => {
    passport.authenticate(
      'google',
      { session: false },
      async (err: any, user: any) => {
        let state: any = {};
        // Safe decoding for state param
        if (req.query.state) {
          try {
            const decoded = decodeURIComponent(req.query.state as string);
            state = JSON.parse(decoded);
          } catch (e) {
            loggers.warn("Malformed Google OAuth state parameter:", req.query.state, e);
            state = {};
          }
        }

        // Decode the inner redirect URLs
        const successRedirect = state.successRedirect
          ? decodeURIComponent(state.successRedirect)
          : `${FRONTEND_URL}/auth/success`;

        const failureRedirect = state.failureRedirect
          ? decodeURIComponent(state.failureRedirect)
          : `${FRONTEND_URL}/login?error=google_auth_failed`;

        const platform = state.platform || 'web';

        try {
          if (err || !user) {
            loggers.error('Google auth error:', err);
            return res.redirect(failureRedirect);
          }

          // Generate access token
          const accessToken = await this.googleAuthService.generateTokens(user);
          const encryptedToken = encryptData(accessToken.toString());

          // Redirect to success URL (appScheme or web)
          return res.redirect(`${successRedirect}?accessToken=${encryptedToken}`);
        } catch (error: any) {
          loggers.error('Error in Google callback:', error);
          return res.redirect(failureRedirect);
        }
      }
    )(req, res, next);
  }



  getUserProfile = asyncHandler(async (req: Request, res: Response) => {
    const { token } = req.body
    if (!token) {
      return res.status(401).json(
        ApiError.unauthorized("Invalid user token")
      )
    }
    const decoded = await new Jtoken().verifyToken(decryptData(token));

    const userData = await this.userRepo.findByEmail(decoded.email);
    if (!userData) {
      return res.status(400).json(
        ApiError.notFound("User not found")
      )
    }
    // Update user status to active
    userData.status = UserStatus.ACTIVE;
    userData.isActive = true;
    await userData.save();

    // Generate app tokens
    const tokenPayload = {
      _id: userData._id.toString(),
      role: userData.role,
      email: userData.email,
    };
    const { password, securityAnswer, ...safeUser } = userData.toObject();
    // Generate tokens
    const { accessToken, refreshToken } = await new JwtAuth().createToken(tokenPayload);
    const [wallet] = await Promise.all([
      this.walletService.createOrGetWallet(userData._id, userData),
      this.sessionService.handleUserLogin(
        userData._id,
        {
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'] || 'unknown',
          token: refreshToken,
        }
      ),
      this.activityService.logActivity({
        title: 'User Login',
        description: `${userData.email} logged in to the platform`,
        activityType: ActivityType.LOGIN,
        user: userData._id,
      })
    ]);
    // Return tokens + user data
    return res.status(200).json(
      ApiResponse.success({
        message: "Google login successful",
        user: { ...safeUser, online: true, status: UserStatus.ACTIVE, isActive: true },
        wallet,
        accessToken,
        refreshToken,
      })
    );
  })

  extractExtension = (filename) => {
    // Find the position of the last dot
    const lastDotIndex = filename.lastIndexOf('.');

    // Check if a dot was found and it's not the very first character
    if (lastDotIndex !== -1 && lastDotIndex < filename.length - 1) {
      // Extract the substring starting one character after the last dot
      return filename.substring(lastDotIndex + 1);
    } else {
      return '';
    }
  }

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

  /**
   *  Handle Apple callback
   */
  handleAppleCallback = asyncHandler(async (req: Request, res: Response) => {
    try {
      const { code, id_token, user: FetchedUser, state } = req.body;
      // Verify CSRF state
      const storedState = req.cookies?.apple_auth_state;
      if (!storedState || storedState !== state) {
        throw ApiError.badRequest('Invalid state parameter - CSRF protection');
      }

      res.clearCookie('apple_auth_state');

      if (!code) {
        return res.status(400).json(
          ApiError.badRequest('Authorization code is missing')
        )
      }

      // Exchange code for tokens
      const tokens = await this.appleAuth.getAuthorizationToken(code);

      // Verify ID token and get user information
      const decodedToken = await this.appleAuth.verifyIdToken(
        tokens.id_token
      );

      // Parse user info from Apple (only available on first sign-in)
      let userInfo: any = {};
      if (FetchedUser && typeof FetchedUser === 'string') {
        try {
          userInfo = JSON.parse(FetchedUser);
        } catch (e) {
          loggers.warn('Failed to parse user info from Apple callback');
        }
      }

      // Extract user data
      const appleUserId = decodedToken.sub;
      const email = decodedToken.email || userInfo.email;
      const firstName =
        userInfo.user?.name?.firstName || decodedToken.email?.split('@')[0];
      const lastName = userInfo.user?.name?.lastName || '';

      // Find or create user
      //   let dbUser = await UserModel.findOne({ googleId: appleUserId });
      let user = await this.userService.getUserByEmail(email);

      if (!user) {
        user = await this.userRepo.createUser(
          { email, googleId: appleUserId, verified: true },
          { lastName: lastName, firstName: firstName }
        );

        user = await this.userService.getUserByEmail(email);
        loggers.info(`New Apple user created: ${appleUserId}`);
      }
      const jtoken = new Jtoken();
      const { accessToken, refreshToken } = await jtoken.createToken({
        email: user.email,
        role: user.role,
        _id: user._id.toString()
      });

      const [wallet] = await Promise.all([
        this.walletService.createOrGetWallet(user._id, user),
        this.sessionService.handleUserLogin(
          user._id,
          {
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'] || 'unknown',
            token: refreshToken,
          }
        ),
        this.activityService.logActivity({
          title: 'User Login',
          description: `${user.email} logged in to the platform`,
          activityType: ActivityType.LOGIN,
          user: user._id,
        })
      ]);
      res.json(new ApiResponse(200, {
        user: { ...user, online: true, status: UserStatus.ACTIVE },
        wallet,
        accessToken,
        refreshToken
      }, 'Login successful'));


    } catch (error) {
      loggers.error('Error handling Apple callback:', error);
      throw error;
    }
  })
}