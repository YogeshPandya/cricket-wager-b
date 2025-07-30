import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Match, MatchDocument } from '../../schemas/match.schema';
import { Model } from 'mongoose';
import { NotFoundException } from '@nestjs/common';

@Injectable()
export class MatchService {
  constructor(
    @InjectModel(Match.name) private matchModel: Model<MatchDocument>,
  ) {}

  async createMatch(data: any): Promise<Match> {
    const match = new this.matchModel(data);
    return match.save();
  }

  async getAllMatches(): Promise<Match[]> {
    return this.matchModel.find().sort({ createdAt: -1 }).exec();
  }

  async deleteMatch(id: string): Promise<any> {
    const deleted = await this.matchModel.findByIdAndDelete(id);
    if (!deleted) {
      throw new NotFoundException('Match not found');
    }
    return { message: 'Match deleted successfully' };
  }
}
