import Joi from 'joi';
import {
    VehicleType,
    VehicleSource,
    VehicleStatus,
    VehicleAvailability,
} from '../../generated/prisma/client';


export const createVehicleSchema = Joi.object({
    vin: Joi.string().required(),
    slug: Joi.string().required(),
    make: Joi.string().required(),
    model: Joi.string().required(),

    year: Joi.number().integer().required(),

    vehicleType: Joi.string()
        .valid(...Object.values(VehicleType))
        .required(),

    priceUsd: Joi.number().required(),
    originalPriceUsd: Joi.number().optional(),

    mileage: Joi.number().integer().optional(),

    transmission: Joi.string().optional(),
    fuelType: Joi.string().optional(),

    images: Joi.array().items(Joi.string()).optional(),

    source: Joi.string()
        .valid(...Object.values(VehicleSource))
        .optional(),

    status: Joi.string()
        .valid(...Object.values(VehicleStatus))
        .optional(),

    availability: Joi.string()
        .valid(...Object.values(VehicleAvailability))
        .optional(),

    featured: Joi.boolean().optional(),
    isActive: Joi.boolean().optional(),
    isHidden: Joi.boolean().optional(),
});


export const saveVehicleSchema = Joi.object({
    userId: Joi.string().required(),
    vehicleId: Joi.string().required(),
  });
  