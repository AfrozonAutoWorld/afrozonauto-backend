import Joi from 'joi';
import {
  OrderStatus,
  OrderPriority,
  ShipmentStatus,
  ShippingMethod
} from '../../generated/prisma/client';

export const createOrderSchema = Joi.object({
  vehicleId: Joi.string().optional(),
  status: Joi.string()
    .valid(...Object.values(OrderStatus))
    .optional(),
  shippingMethod: Joi.string()
    .valid(...Object.values(ShippingMethod))
    .required(),
  // destinationCountry: Joi.string().optional(),
  // destinationState: Joi.string().optional(),
  // destinationCity: Joi.string().optional(),
  // destinationAddress: Joi.string().optional(),

  priority: Joi.string()
    .valid(...Object.values(OrderPriority))
    .default(OrderPriority.LOW)
    .optional(),
  identifier: Joi.string().optional(),
  type: Joi.string().optional(),
  customerNotes: Joi.string().optional(),
  specialRequests: Joi.string().optional(),
});

export const AdminNoteSchema = Joi.object({
  note: Joi.string().required(),
  isInternal: Joi.boolean().default(true),
  category: Joi.string()
});

export const updateOrderSchema = Joi.object({
  destinationCountry: Joi.string().optional(),
  destinationState: Joi.string().optional(),
  destinationCity: Joi.string().optional(),
  destinationAddress: Joi.string().optional(),
  customerNotes: Joi.string().optional(),
  specialRequests: Joi.string().optional(),
  deliveryInstructions: Joi.string().optional(),
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
export const cancelOrder = Joi.object({
  reason: Joi.string().required()
});
