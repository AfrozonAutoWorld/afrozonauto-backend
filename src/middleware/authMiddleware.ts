import { Response, NextFunction } from 'express';
import Jtoken from '../middleware/Jtoken';
import { UserRepository } from '../repositories/UserRepository';
import { UserRole } from '../generated/prisma/client';
import { AuthenticatedRequest } from '../types/customRequest';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';
import { TYPES } from '../config/types';
import { container } from '../config/inversify.config';


// Get Jtoken instance from container
const jtoken = container.get<Jtoken>(TYPES.Jtoken);
const userRepository = new UserRepository();


export const authenticate = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const header = req.header('Authorization');

    if (!header || !header.startsWith('Bearer ')) {
      throw ApiError.unauthorized('Authentication required');
    }

    const token = header.replace('Bearer ', '').trim();

    const payload = await jtoken.verifyToken(token);
    if (!payload || !payload.id) {
      throw ApiError.unauthorized('Invalid or expired token');
    }

    const user = await userRepository.findById(payload.id);
    if (!user) {
      throw ApiError.unauthorized('User not found');
    }

    if (!user.isActive) {
      throw ApiError.forbidden('Account is inactive');
    }

    if (user.isSuspended) {
      throw ApiError.forbidden(
        user.suspensionReason || 'Account is suspended'
      );
    }

    req.user = user as any;

    next();
  }
);

export const authorize = (requiredRoles: UserRole[]) =>
  asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw ApiError.unauthorized('Authentication required');
    }

    if (!requiredRoles.includes(req.user.role)) {
      throw ApiError.forbidden(
        `Access restricted to: ${requiredRoles.join(', ')}`
      );
    }

    next();
  });


export const requireRoles = (roles: UserRole[]) => authorize(roles);

export const requireAdmin = authorize([
  UserRole.SUPER_ADMIN,
  UserRole.OPERATIONS_ADMIN,
]);

export const requireCustomer = authorize([UserRole.BUYER]);

export const requireSuperAdmin = authorize([UserRole.SUPER_ADMIN]);
