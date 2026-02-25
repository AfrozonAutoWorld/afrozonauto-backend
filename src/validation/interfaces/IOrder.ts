import { Order } from "../../generated/prisma/client";
import { OrderPriority, ShippingMethod } from "../../generated/prisma/enums";

export interface CreateOrderData {
  userId: string;
  vehicleId?: string;
  shippingMethod: ShippingMethod;
  destinationCountry?: string;
  destinationState?: string;
  destinationCity?: string;
  destinationAddress?: string;
  deliveryInstructions?: string;
  customerNotes?: string;
  specialRequests?: string;
  tags?: string[];
  vehicleSnapshot: Record<string, any>;
  paymentBreakdown: Record<string, any>;
}

export interface UpdateOrderData {
  shippingMethod?: ShippingMethod;
  destinationCountry?: string;
  destinationState?: string;
  destinationCity?: string;
  destinationAddress?: string;
  deliveryInstructions?: string;
  customerNotes?: string;
  specialRequests?: string;
  estimatedDeliveryDate?: Date;
  priority?: OrderPriority;
  tags?: string[];
}

export interface OrderWithDetails extends Order {
  user?: any;
  vehicle?: any;
  payments?: any[];
  inspection?: any;
  shipment?: any;
}
