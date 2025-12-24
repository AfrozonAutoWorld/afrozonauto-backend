import { inject, injectable } from 'inversify';
import { Response } from 'express';
import { TYPES } from '../config/types';
import { AuthenticatedRequest } from '../types/customRequest';
import { AddressService } from '../services/AddressService';
import { AddressType } from '@prisma/client';
import { defaultAddressQuerySchema } from "../validations/addressValidations";
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';

@injectable()
export class AddressController {
  constructor(
    @inject(TYPES.AddressService) private addressService: AddressService
  ) { }

  createAddress = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user._id;
    const address = await this.addressService.createAddress({ ...req.body, userId });
    
    res.status(201).json(new ApiResponse(201, address, 'Address created successfully'));
  });

  getUserAddresses = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const addresses = await this.addressService.getUserAddresses(req.user.id);
    
    res.json(new ApiResponse(200, addresses, 'User addresses retrieved successfully'));
  });

  getDefaultAddress = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    // Validate query parameters
    const { error, value } = defaultAddressQuerySchema.validate(req.query);
    
    if (error) {
      return res.status(400).json( ApiError.badRequest(
        'Invalid query parameters',
        error.details.map(d => ({
          field: d.path.join('.'),
          message: d.message
        }))
      ));
    }

    const type = value.type as AddressType || AddressType.NORMAL;
    const address = await this.addressService.getDefaultAddress(req.user.id, type);

    if (!address) {
      return res.status(404).json( ApiError.notFound(
        'Default address not found',
        {
          requestedType: type,
          suggestion: 'Try creating a default address first',
          allowedTypes: Object.values(AddressType)
        }
      ));
    }

    res.json(new ApiResponse(200, address, 'Default address retrieved successfully'));
  });

  updateAddress = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const address = await this.addressService.updateAddress(req.params.id, req.body);
    
    if (!address) {
      return res.status(404).json( ApiError.notFound('Address not found'));
    }
    
    res.json(new ApiResponse(200, address, 'Address updated successfully'));
  });

  deleteAddress = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const deleted = await this.addressService.deleteAddress(req.params.id);
    
    if (!deleted) {
      return res.status(404).json( ApiError.notFound('Address not found'));
    }
    
    res.json(new ApiResponse(200, { deleted }, 'Address deleted successfully'));
  });
}