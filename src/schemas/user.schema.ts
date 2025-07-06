// src/modules/user/schemas/user.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true }) // this adds createdAt and updatedAt
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

  @Prop()
  referralCode?: string;

  @Prop({ default: 0 })
  amount: number;

  @Prop({ default: 0 })
  withdrawableAmount: number;
}

export const UserSchema = SchemaFactory.createForClass(User);
