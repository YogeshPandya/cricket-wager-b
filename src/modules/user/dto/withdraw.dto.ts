// src/user/dto/withdraw.dto.ts
import { IsNumber, IsString, IsNotEmpty } from 'class-validator';

export class WithdrawDto {
  @IsNumber()
  @IsNotEmpty() // ✅ Ensures amount is not empty
  amount: number;

  @IsString()
  @IsNotEmpty() // ✅ Ensures UPI ID is not blank like ""
  upiId: string;

  @IsString()
  @IsNotEmpty() // ✅ Ensures holder name is provided
  holderName: string;
}
