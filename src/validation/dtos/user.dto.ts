
import {
    IsEmail,
    IsEnum,
    IsOptional,
    IsString,
    IsBoolean,
} from 'class-validator';
import { UserRole } from '../../generated/prisma/client';

export class CreateUserDto {
    @IsEmail()
    email!: string;

    @IsOptional()
    @IsString()
    password?: string;

    @IsOptional()
    @IsString()
    fullName?: string;

    @IsOptional()
    @IsString()
    phone?: string;

    @IsOptional()
    @IsEnum(UserRole)
    role?: UserRole;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}