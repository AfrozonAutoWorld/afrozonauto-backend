import Joi from 'joi';
import {
    OrderStatus,
    OrderPriority,
    ShipmentStatus, 
    ShippingMethod
  } from '../../generated/prisma/client';
  
  export const createOrderSchema = Joi.object({
    userId: Joi.string().required(),
    vehicleId: Joi.string().required(),
  
    status: Joi.string()
      .valid(...Object.values(OrderStatus))
      .optional(),
  
    shippingMethod: Joi.string()
      .valid(...Object.values(ShippingMethod))
      .optional(),
  
    destinationCountry: Joi.string().optional(),
    destinationState: Joi.string().optional(),
    destinationCity: Joi.string().optional(),
    destinationAddress: Joi.string().optional(),
  
    priority: Joi.string()
      .valid(...Object.values(OrderPriority))
      .optional(),
  
    customerNotes: Joi.string().optional(),
    specialRequests: Joi.string().optional(),
  });


export const createShipmentSchema = Joi.object({
  orderId: Joi.string().required(),

  shippingMethod: Joi.string()
    .valid(...Object.values(ShippingMethod))
    .optional(),

  carrier: Joi.string().optional(),
  carrierTrackingNumber: Joi.string().optional(),

  status: Joi.string()
    .valid(...Object.values(ShipmentStatus))
    .optional(),
});
