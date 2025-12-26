import {
    IsEnum,
    IsOptional,
    IsString,
    IsNumber,
  } from 'class-validator';
  import {
    PaymentType,
    PaymentMethod,
  } from  '../../generated/prisma/client';
  ;
  
  export class CreatePaymentDto {
    @IsString()
    orderId!: string;
  
    @IsString()
    userId!: string;
  
    @IsNumber()
    amountUsd!: number;
  
    @IsOptional()
    @IsNumber()
    amountLocal?: number;
  
    @IsEnum(PaymentType)
    paymentType!: PaymentType;
  
    @IsOptional()
    @IsEnum(PaymentMethod)
    paymentMethod?: PaymentMethod;
  
    @IsOptional()
    @IsString()
    paymentProvider?: string;
  
    @IsOptional()
    @IsString()
    transactionRef?: string;
  
    @IsOptional()
    @IsString()
    description?: string;
  }
  