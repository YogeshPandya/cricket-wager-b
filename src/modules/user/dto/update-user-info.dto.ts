import { IsOptional, IsString, IsEmail } from 'class-validator';

export class UpdateUserInfoDto {
  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Invalid email format' })
  email?: string;
}
