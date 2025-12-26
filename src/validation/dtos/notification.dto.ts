import { IsEnum, IsOptional, IsString } from 'class-validator';
import { NotificationType } from  '../../generated/prisma/client';

export class CreateNotificationDto {
  @IsString()
  userId!: string;

  @IsOptional()
  @IsString()
  orderId?: string;

  @IsEnum(NotificationType)
  type!: NotificationType;

  @IsString()
  title!: string;

  @IsString()
  message!: string;

  @IsOptional()
  @IsString()
  actionUrl?: string;

  @IsOptional()
  @IsString()
  actionLabel?: string;
}
