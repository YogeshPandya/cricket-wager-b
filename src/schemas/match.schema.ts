import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as mongoose from 'mongoose';

export type MatchDocument = Match & Document;

@Schema({ timestamps: true })
export class Match {
  @Prop({ required: true }) league: string;
  @Prop({ required: true }) format: string;
  @Prop({ required: true }) teamA: string;
  @Prop({ required: true }) teamB: string;
  @Prop() logoA: string;
  @Prop() logoB: string;
  @Prop({ required: true }) date: string;
  @Prop({ required: true }) time: string;
  @Prop({ required: true }) series: string;
  @Prop({ default: 'upcoming' }) status: string;
  //new code
  @Prop({
    type: [
      {
        _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
        question: { type: String, required: true },
        isVisible: { type: Boolean, default: true },
        options: {
          type: [
            {
              _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
              label: { type: String, required: true },
              ratio: { type: String, required: true }, // Better to use String for "4/10" etc.
            },
          ],
          validate: [
            (val: any[]) => val.length > 0,
            'At least one option required.',
          ],
        },
        result: { type: String, default: '' }, // Store the `label` of the winning option
      },
    ],
    default: [],
  })
  questions: {
    _id?: any;
    question: string;
    isVisible: boolean;
    options: {
      _id: string;
      label: string;
      ratio: string;
    }[];
    result: string;
  }[];
}

export const MatchSchema = SchemaFactory.createForClass(Match);
