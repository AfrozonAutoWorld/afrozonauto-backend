import { Request, Response } from 'express';
import { UserService } from '../services/UserService';
import { injectable, inject } from 'inversify';
import { TYPES } from '../config/types';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';

@injectable()
export class UserController {
  constructor(@inject(TYPES.UserService) private userService: UserService) {
  }

  getUserByEmail = asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.params;
    
    if (!email) {
      throw ApiError.badRequest('Email parameter is required');
    }

    const user = await this.userService.getUserByEmail(email);
    
    if (!user) {
      throw ApiError.notFound('User not found');
    }
    
    res.json(new ApiResponse(200, user, 'User retrieved successfully'));
  });

  verifyUser = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    
    if (!userId) {
      throw ApiError.badRequest('User ID parameter is required');
    }

    const result = await this.userService.verifyUser(userId);
    
    if (!result) {
      throw ApiError.internal('Verification failed');
    }
    
    res.json(new ApiResponse(200, { verified: true }, 'User verified successfully'));
  });

  deactivateAccount = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    
    if (!userId) {
      throw ApiError.badRequest('User ID parameter is required');
    }

    const result = await this.userService.deactivateUser(userId);
    
    if (!result) {
      throw ApiError.internal('Deactivation failed');
    }
    
    res.json(new ApiResponse(200, { deactivated: true }, 'Account deactivated successfully'));
  });

  updatePassword = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const { newPassword } = req.body;
    
    if (!userId) {
      throw ApiError.badRequest('User ID parameter is required');
    }

    if (!newPassword) {
      throw ApiError.badRequest('New password is required');
    }

    if (newPassword.length < 6) {
      throw ApiError.badRequest('Password must be at least 6 characters long');
    }

    const result = await this.userService.updateUserPassword(userId, newPassword);
    
    if (!result) {
      throw ApiError.internal('Password update failed');
    }
    
    res.json(new ApiResponse(200, { updated: true }, 'Password updated successfully'));
  });

  getActiveUsers = asyncHandler(async (req: Request, res: Response) => {
    const users = await this.userService.getAllActiveUsers();
    
    res.json(new ApiResponse(200, users, 'Active users retrieved successfully'));
  });
}