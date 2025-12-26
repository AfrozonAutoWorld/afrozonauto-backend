import { IsOptional, IsString, IsBoolean } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  avatar?: string;

  @IsOptional()
  @IsString()
  businessName?: string;

  @IsOptional()
  @IsString()
  taxId?: string;

  @IsOptional()
  @IsBoolean()
  isVerified?: boolean;
}
