import Joi from 'joi';
import { VehicleStatus, VehicleListingCondition, VehicleType } from '../../generated/prisma/client';

export const createSellerVehicleSchema = Joi.object({
    // Step 1: Vehicle Details
    year: Joi.number().integer().min(1900).max(new Date().getFullYear() + 1).required(),
    make: Joi.string().required(),
    model: Joi.string().required(),
    vehicleType: Joi.string()
        .uppercase()
        .valid(...Object.values(VehicleType))
        .default(VehicleType.OTHER)
        .messages({ 'any.only': `vehicleType must be one of: ${Object.values(VehicleType).join(', ')}` }),
    trim: Joi.string().allow('', null).optional(),
    bodyStyle: Joi.string().allow('', null).optional(),
    mileage: Joi.number().integer().min(0).required(),
    vin: Joi.string().allow('', null).optional(),
    transmission: Joi.string().allow('', null).optional(),
    drivetrain: Joi.string().allow('', null).optional(),
    fuelType: Joi.string().allow('', null).optional(),
    exteriorColor: Joi.string().allow('', null).optional(),
    cylinders: Joi.number().integer().min(0).optional(),

    // Step 2: Vehicle Condition
    condition: Joi.string()
        .uppercase()
        .valid(...Object.values(VehicleListingCondition))
        .required()
        .messages({
            'any.only': `condition must be one of: ${Object.values(VehicleListingCondition).join(', ')}`,
        }),
    // .single() allows a bare string to be coerced into a one-element array (multipart form-data sends single values as strings)
    titleStatus: Joi.array().items(Joi.string()).single().min(1).required(),
    accidentHistory: Joi.string().required(),
    knownIssues: Joi.array().items(Joi.string()).single().default([]),
    keys: Joi.number().integer().min(0).optional(),
    features: Joi.array().items(Joi.string()).single().optional(),
    highlights: Joi.array().items(Joi.string()).single().optional(),
    modifications: Joi.string().allow('', null).optional(),

    // Step 3: Photos & Price
    uploadedFiles: Joi.array()
    .items(Joi.object({
      url: Joi.string().uri().required(),
      fileSize: Joi.number().min(0).required(),
      fileType: Joi.string().optional(),
      format: Joi.string().required(),
      publicId: Joi.string().required(),
      imageName: Joi.string().optional(),
      documentName: Joi.string().allow(null, '').optional(),
      uploadIndex: Joi.number().optional(),
    }))
    .optional(),
    askingPrice: Joi.number().positive().required(),
    showAskingPrice: Joi.boolean().default(true),
    allowOffers: Joi.boolean().default(true),
    additionalNotes: Joi.string().allow('', null).optional(), // mapped → manualNotes in service

    // Step 4: Contact Details (Mapping to contactFirstName etc in model)
    contactFirstName: Joi.string().required(),
    contactLastName: Joi.string().required(),
    contactEmail: Joi.string().email().required(),
    contactPhone: Joi.string().required(),
    city: Joi.string().required(),
    zipCode: Joi.string().required(),
    preferredContact: Joi.string().valid('Email', 'Phone', 'SMS').optional(),
    bestTimeToReach: Joi.string().optional(),

    variants: Joi.alternatives().try(
        Joi.string(),
        Joi.array().items(
          Joi.object({
            name: Joi.string(),
            options: Joi.array().items(
              Joi.object({
                name: Joi.string(),
                price: Joi.number(),
                // Add other option fields as needed
              })
            )
          })
        )
      ).optional(),
      
      address: Joi.alternatives().try(
        Joi.string(),
        Joi.object({
          street: Joi.string(),
          city: Joi.string(),
          state: Joi.string(),
          zipCode: Joi.string(),
          country: Joi.string()
        })
      ).optional(),
      
      variantImageIndexes: Joi.alternatives().try(
        Joi.string(),
        Joi.object().pattern(
          Joi.string(), 
          Joi.array().items(Joi.number().min(1))
        )
      ).optional(),
      
      documentName: Joi.alternatives().try(
        Joi.string(),
        Joi.array().items(Joi.string())
      ).optional(),

    /** JSON string array (9 slots) of kept image URLs when updating a listing; empty string = new upload fills slot */
    existingImageUrls: Joi.string().allow('', null).optional(),
});

export const updateSellerVehicleStatusSchema = Joi.object({
    status: Joi.string()
        .valid(...Object.values(VehicleStatus))
        .required(),
    adminNotes: Joi.string().allow('', null).optional(),
});
