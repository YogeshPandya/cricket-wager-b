import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true })
  username: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  phoneNumber: string;

  @Prop({ required: true })
  password: string; // hashed password only

  @Prop({ default: Date.now })
  registrationDate: Date;

  @Prop({ type: [{ amount: Number }] })
  rechargeHistory: { amount: number }[];

  @Prop({ type: [{ amount: Number }] })
  withdrawalHistory: { amount: number }[];

  @Prop({ type: [{ amount: Number, winAmount: Number }] })
  bets: { amount: number; winAmount: number }[];

  // For forgot/reset password
  @Prop()
  resetToken?: string;

  @Prop()
  resetTokenExpires?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
