import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true }) // Automatically adds createdAt and updatedAt fields
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
  password: string;

  @Prop({ default: null })
  referralCode?: string;

  @Prop({ default: 0 })
  amount: number; // Total balance

  @Prop({ default: 0 })
  withdrawableAmount: number; // Balance that can be withdrawn

  // ✅ Added for Forgot Password
  @Prop()
  resetToken?: string;

  @Prop()
  resetTokenExpires?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
