import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

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
}

export const MatchSchema = SchemaFactory.createForClass(Match);
