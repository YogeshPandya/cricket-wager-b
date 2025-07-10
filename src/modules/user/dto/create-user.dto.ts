// src/modules/user/dto/create-user.dto.ts

import {
  IsString,
  IsEmail,
  IsOptional,
  MinLength,
  IsPhoneNumber,
} from 'class-validator';

export class CreateUserDto {
  @IsString()
  username: string;

  @IsString()
  name: string;

  @IsEmail({}, { message: 'Invalid email address' })
  email: string;

  @IsPhoneNumber('IN', {
    message: 'Phone number must be a valid Indian number',
  })
  phoneNumber: string;

  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;

  @IsOptional()
  @IsString()
  referralCode?: string;
}
