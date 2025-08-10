// src/modules/user/dto/recharge-request.dto.ts
import { IsNumber, IsString } from 'class-validator';

export class RechargeRequestDto {
  @IsNumber()
  amount: number;

  @IsString()
  utr: string;
}
