// dtos/order.dto.ts
import {
    IsEnum,
    IsOptional,
    IsString,
    IsNumber,
} from 'class-validator';
import {
    OrderStatus,
    ShippingMethod,
    OrderPriority,
} from '../../generated/prisma/client';

export class CreateOrderDto {
    @IsString()
    userId!: string;

    @IsString()
    vehicleId!: string;

    @IsOptional()
    @IsEnum(OrderStatus)
    status?: OrderStatus;

    @IsOptional()
    @IsEnum(ShippingMethod)
    shippingMethod?: ShippingMethod;

    @IsOptional()
    @IsString()
    destinationCountry?: string;

    @IsOptional()
    @IsString()
    destinationState?: string;

    @IsOptional()
    @IsString()
    destinationCity?: string;

    @IsOptional()
    @IsString()
    destinationAddress?: string;

    @IsOptional()
    @IsEnum(OrderPriority)
    priority?: OrderPriority;

    @IsOptional()
    @IsString()
    customerNotes?: string;

    @IsOptional()
    @IsString()
    specialRequests?: string;
}
