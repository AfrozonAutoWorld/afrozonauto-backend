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
      return res.status(400).json( ApiError.badRequest('Email parameter is required'))
    }

    const user = await this.userService.getUserByEmail(email);
    
    if (!user) {
      return res.status(404).json( ApiError.notFound('User not found'))
    }
    
    return res.status(200).json( ApiResponse.success( user, 'User retrieved successfully'));
  });

  verifyUser = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json( ApiError.badRequest('User ID parameter is required'))
    }

    const result = await this.userService.getUserById(userId);
    
    if (!result) {
      return res.status(500).json( ApiError.internal('Verification failed'))
    }
    
    return res.json(new ApiResponse(200, { verified: true }, 'User verified successfully'));
  });

  deactivateAccount = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(404).json( ApiError.badRequest('User ID parameter is required'))
    }

    const result = await this.userService.deleteUser(userId);
    
    if (!result) {
      return res.status(500).json( ApiError.internal('Deactivation failed'))
    }
    
    return res.json( ApiResponse.success({ deactivated: true }, 'Account deactivated successfully'));
  });

  updatePassword = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const { newPassword } = req.body;
    
    if (!userId) {
      return res.status(404).json( ApiError.badRequest('User ID parameter is required'))
    }

    if (!newPassword) {
      return res.status(400).json( ApiError.badRequest('New password is required'))
    }

    if (newPassword.length < 6) {
      return res.status(400).json( ApiError.badRequest('Password must be at least 6 characters long'))
    }

    const result = await this.userService.updateUserPassword(userId, newPassword);
    
    if (!result) {
      return res.status(500).json( ApiError.internal('Password update failed'))
    }
    
    return res.json(new ApiResponse(200, { updated: true }, 'Password updated successfully'));
  });


}