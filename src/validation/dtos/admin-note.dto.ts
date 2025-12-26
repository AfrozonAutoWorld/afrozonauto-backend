import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateAdminNoteDto {
  @IsOptional()
  @IsString()
  orderId?: string;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsString()
  note!: string;

  @IsOptional()
  @IsBoolean()
  isInternal?: boolean;

  @IsOptional()
  @IsString()
  category?: string;
}
