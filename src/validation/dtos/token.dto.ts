import { IsInt, IsOptional, IsString } from 'class-validator';

export class CreateTokenDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsInt()
  token!: number;
}
