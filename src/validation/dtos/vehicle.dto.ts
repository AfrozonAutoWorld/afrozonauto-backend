import {
    IsString,
    IsInt,
    IsEnum,
    IsOptional,
    IsBoolean,
    IsNumber,
    IsArray,
  } from 'class-validator';
  import {
    VehicleType,
    VehicleSource,
    VehicleStatus,
    VehicleAvailability,
  } from  '../../generated/prisma/client';;
  
  export class CreateVehicleDto {
    @IsString()
    vin!: string;
  
    @IsString()
    slug!: string;
  
    @IsString()
    make!: string;
  
    @IsString()
    model!: string;
  
    @IsInt()
    year!: number;
  
    @IsEnum(VehicleType)
    vehicleType!: VehicleType;
  
    @IsNumber()
    priceUsd!: number;
  
    @IsOptional()
    @IsNumber()
    originalPriceUsd?: number;
  
    @IsOptional()
    @IsInt()
    mileage?: number;
  
    @IsOptional()
    @IsString()
    transmission?: string;
  
    @IsOptional()
    @IsString()
    fuelType?: string;
  
    @IsOptional()
    @IsArray()
    images?: string[];
  
    @IsOptional()
    @IsEnum(VehicleSource)
    source?: VehicleSource;
  
    @IsOptional()
    @IsEnum(VehicleStatus)
    status?: VehicleStatus;
  
    @IsOptional()
    @IsEnum(VehicleAvailability)
    availability?: VehicleAvailability;
  
    @IsOptional()
    @IsBoolean()
    featured?: boolean;
  
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
  
    @IsOptional()
    @IsBoolean()
    isHidden?: boolean;
  }
  