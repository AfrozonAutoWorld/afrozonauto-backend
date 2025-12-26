import { IsEnum, IsOptional, IsString, IsBoolean } from 'class-validator';
import { AddressType} from '../../generated/prisma/client';

export class CreateAddressDto {
  @IsEnum(AddressType)
  @IsOptional()
  type?: AddressType;

  @IsOptional()
  @IsString()
  street?: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsString()
  city!: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  postalCode?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @IsOptional()
  @IsString()
  additionalInfo?: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  additionalPhoneNumber?: string;
}
