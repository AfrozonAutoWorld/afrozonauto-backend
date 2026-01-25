import { inject, injectable } from 'inversify';
import { Response } from 'express';
import { TYPES } from '../config/types';
import { AuthenticatedRequest } from '../types/customRequest';
import { AddressService } from '../services/AddressService';
import { AddressType } from '../generated/prisma/client';
import { createAddressSchema } from "../validation/schema/address.validation";
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';

@injectable()
export class AddressController {
  constructor(
    @inject(TYPES.AddressService) private addressService: AddressService
  ) { }

  createAddress = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      throw ApiError.unauthorized('User not authenticated');
    }
    if (!req.user.profile) {
      return res.status(400).json( ApiError.badRequest('User profile not found'))
    }

    const userId = req.user.id;
    const address = await this.addressService.createAddress(req.user.profile.id, {
      ...req.body,
      userId,
    });
    return res
      .status(201)
      .json(new ApiResponse(201, address, 'Address created successfully'));
  });


  getUserAddresses = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json( ApiError.unauthorized('User not authenticated'))
    }
    const profileId = req.user.profile?.id;
    if(!profileId){
      return res.status(400).json( ApiError.badRequest('Kindly create your profile')) 
    }
    const addresses = await this.addressService.getUserAddresses(profileId);
    return res.json(new ApiResponse(200, addresses, 'User addresses retrieved successfully'));
  });

  getDefaultAddress = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    // Validate query parameters
    if (!req.user) {
      return res.status(401).json( ApiError.unauthorized('User not authenticated'))
    }
    const profileId = req.user.profile?.id;
    if(!profileId){
      return res.status(400).json( ApiError.badRequest('Kindly create your profile')) 
    }

    const type = req.body?.type as AddressType || AddressType.NORMAL;
    const address = await this.addressService.getDefaultAddress(profileId, type);

    if (!address) {
      return res.status(404).json(ApiResponse.success(
        {},
        'Default address not set'
      ));
    }
    return res.json(new ApiResponse(200, address, 'Default address retrieved successfully'));
  });

  updateAddress = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const address = await this.addressService.updateAddress(req.params.id, req.body);

    if (!address) {
      return res.status(404).json(ApiError.notFound('Address not found'));
    }
    return res.json(new ApiResponse(200, address, 'Address updated successfully'));
  });

  deleteAddress = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const deleted = await this.addressService.deleteAddress(req.params.id);
    if (!deleted) {
      return res.status(404).json(ApiError.notFound('Address not found'));
    }
    return res.json(new ApiResponse(200, { deleted }, 'Address deleted successfully'));
  });
}