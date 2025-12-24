import { Response, NextFunction } from 'express';
import { container } from '../config/inversify.config';
import Jtoken from '../middleware/Jtoken';
import { UserRepository } from '../repositories/UserRepository';
import { ActionType, UserModel, UserRole } from '../models/User';
import { AuthenticatedRequest } from '../types/customRequest';
import { TYPES } from '../config/types';
import { Address, User} from '@prisma/client';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';


const tokenService = new Jtoken();
const userRepository = new UserRepository(User, Address);

export const authenticate = asyncHandler(async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  // Extract token
  const header = req.header('Authorization');
  if (!header || !header.startsWith('Bearer ')) {
    throw ApiError.unauthorized('Authentication required');
  }
  
  const token = header.replace('Bearer ', '').trim();
  
  // Verify & decode
  const payload = await tokenService.verifyToken(token);
  if (!payload) {
    throw ApiError.unauthorized('Invalid or expired token');
  }

  // Fetch user by ID
  const user = await userRepository.findById(payload._id);
  if (!user) {
    throw ApiError.unauthorized('User not found');
  }

  // Check account status
  if (!user.isActive || user.isDeleted) {
    throw ApiError.forbidden('Account is not active');
  }

  // Attach to request and proceed
  req.user = user;
  next();
});

// Role authorization middleware
export const authorize = (requiredRoles: UserRole[]) => {
  return asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw ApiError.unauthorized('Authentication required');
    }

    // Check if user has at least one of the required roles
    if (!requiredRoles.includes(req.user.role)) {
      // Log unauthorized access attempt
      
      throw ApiError.forbidden(`Access restricted to: ${requiredRoles.join(', ')}`);
    }
 
    next();
  });
};

//  Create a middleware factory for specific roles
export const requireRoles = (roles: UserRole[]) => authorize(roles);

// Pre-defined role-based middlewares
export const requireAdmin = authorize([UserRole.ADMIN, UserRole.SUPER_ADMIN]);
export const requireCustomer = authorize([UserRole.CUSTOMER]);
export const requireSuperAdmin = authorize([UserRole.SUPER_ADMIN]);