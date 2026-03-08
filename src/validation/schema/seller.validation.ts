import Joi from 'joi';
import { SellerVerificationStatus } from '../../generated/prisma/client';

export const registerSellerSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    phone: Joi.string().optional(),
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    businessName: Joi.string().optional(),
    taxId: Joi.string().optional(),
    identificationNumber: Joi.string().optional(),
    identificationType: Joi.string().optional(),
    uploadedFiles: Joi.array().items(Joi.object({
        url: Joi.string().uri().required(),
        documentName: Joi.string().required(), // businessRegistration, vendorNIN, etc.
        fileSize: Joi.number().optional(),
        fileType: Joi.string().optional(),
        format: Joi.string().optional(),
        publicId: Joi.string().optional(),
    })).min(1).required(), // Seller needs documents
});

export const applyAsSellerSchema = Joi.object({
    businessName: Joi.string().optional(),
    taxId: Joi.string().optional(),
    identificationNumber: Joi.string().optional(),
    identificationType: Joi.string().optional(),
    uploadedFiles: Joi.array().items(Joi.object({
        url: Joi.string().uri().required(),
        documentName: Joi.string().required(),
        fileSize: Joi.number().optional(),
        fileType: Joi.string().optional(),
        format: Joi.string().optional(),
        publicId: Joi.string().optional(),
    })).min(1).required(), // Seller needs documents
});

export const verifySellerSchema = Joi.object({
    approve: Joi.boolean().required(),
    reason: Joi.string().when('approve', {
        is: false,
        then: Joi.required(),
        otherwise: Joi.optional()
    }),
});
