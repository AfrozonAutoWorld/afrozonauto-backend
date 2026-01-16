import { Response } from 'express';
import { inject, injectable } from 'inversify';
import { ProfileService } from '../services/ProfileService';
import { TYPES } from '../config/types';
import { AuthenticatedRequest } from '../types/customRequest';
import { UserService } from '../services/UserService';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import { comparePassword, hashPassword } from '../utils/password';

@injectable()
export class ProfileController {
  constructor(
    @inject(TYPES.ProfileService) private profileService: ProfileService,
    @inject(TYPES.UserService) private userService: UserService
  ) { }

  create = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { uploadedFiles, ...data } = req.body;
    if (!req.user) {
      return res.status(401).json(
        ApiError.unauthorized('User not authenticated')
      )
    }
    const userId = req.user.id;
    const uploadedFilex = req.body.uploadedFiles || [];

    const result = await this.profileService.create(
      { ...data, files: uploadedFilex },
      userId.toString()
    );
    return res.status(201).json(new ApiResponse(201, result, 'Profile created successfully'));
  });

  getById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await this.profileService.findById(req.params.id);
    if (!result) {
      return res.status(404).json(ApiError.notFound('Profile not found'));
    }
    return res.json(new ApiResponse(200, result, 'Profile retrieved successfully'));
  });

  update = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { uploadedFiles, phoneNumber, ...data } = req.body;
    if (!req.user) {
      return res.status(401).json(
        ApiError.unauthorized('User not authenticated')
      )
    }
    const userId = req.user.id;
    const uploadedFilex = req.body.uploadedFiles || [];

    const promises: Promise<any>[] = [
      this.profileService.update(
        userId.toString(),
        { ...data, files: uploadedFilex }
      )
    ];

    if (phoneNumber) {
      promises.push(
        this.userService.updateUserInfo(userId, { phoneNumber })
      );
    }

    await Promise.all(promises);
    const userInfo = await this.userService.getUserByEmail(req.user?.email)
    const { ...profile } = userInfo
    return res.json(ApiResponse.success({ ...profile }, 'Profile updated successfully'));
  });

  delete = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    await this.profileService.delete(req.params.id);

    res.status(204).send();
  });

  list = asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
    const profiles = await this.profileService.findAll();

    res.json(new ApiResponse(200, profiles, 'Profiles retrieved successfully'));
  });

  currentUserProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json(
        ApiError.unauthorized('User not authenticated')
      )
    }
    const userId = req.user.id;
    const [profiles] = await Promise.all([
      this.profileService.findUserById(userId.toString()),
    ]);
    return res.json(new ApiResponse(200, profiles, 'User profile retrieved successfully'));
  });


  resetPassword = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { oldPassword, newPassword } = req.body;

    if (!req.user) {
      return res.status(401).json(
        ApiError.unauthorized('User not authenticated')
      )
    }
    if (!oldPassword || !newPassword) {
      return res.status(400).json(
        ApiError.badRequest('Old password and new password are required')
      )
    }

    if (newPassword.length < 6) {
      return res.status(400).json(
        ApiError.badRequest('New password must be at least 6 characters long')
      )
    }

    const user = await this.userService.findById(req.user.id);
    if (!user || !user.passwordHash) {
      return res.status(404).json(
        ApiError.notFound('User not found')
      )
    }

    const isMatch = await comparePassword(oldPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json(ApiError.badRequest('Old password is incorrect'))
    }

    const isSameAsOld = await comparePassword(newPassword, user.passwordHash);
    if (isSameAsOld) {
      return res.status(400).json(
        ApiError.badRequest(
          'New password cannot be the same as the old password'
        )
      )
    }

    const hashed = await hashPassword(newPassword);

    await this.userService.updateUser(user.id, {
      passwordHash: hashed,
    });

    return res.status(200).json(
       ApiResponse.success(null, 'Password reset successfully')
    );
  });

}