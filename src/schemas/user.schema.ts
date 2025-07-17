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
  password: string; // Hashed password only

  @Prop({ default: Date.now })
  registrationDate: Date;

  @Prop({
    type: [
      {
        amount: Number,
        utr: String,
        status: {
          type: String,
          enum: ['Pending', 'Success', 'Failed'],
          default: 'Pending',
        },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    default: [],
  })
  rechargeHistory: {
    amount: number;
    utr: string;
    status: 'Pending' | 'Success' | 'Failed';
    createdAt: Date;
  }[];

  @Prop({
    type: [
      {
        amount: Number,
        upiId: String,
        holderName: String,
        status: {
          type: String,
          enum: ['Pending', 'Success', 'Failed'],
          default: 'Pending',
        },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    default: [],
  })
  withdrawalHistory: {
    amount: number;
    upiId: string;
    holderName: string;
    status: 'Pending' | 'Success' | 'Failed';
    createdAt: Date;
  }[];

  @Prop({
    type: [
      {
        amount: Number,
        winAmount: Number,
        questionId: String,
        isWon: Boolean,
      },
    ],
    default: [],
  })
  bets: {
    amount: number;
    winAmount: number;
    questionId: string;
    isWon: boolean;
  }[];

  @Prop()
  resetToken?: string;

  @Prop()
  resetTokenExpires?: Date;

  @Prop({ default: 0 })
  balance: number;

  @Prop()
  profilePic?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
