// src/modules/user/dto/login-user.dto.ts

import { IsString, MinLength } from 'class-validator';

export class LoginUserDto {
  @IsString({ message: 'Username must be a string' })
  username: string;

  @IsString({ message: 'Password must be a string' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;
}
