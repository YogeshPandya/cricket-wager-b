import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Match, MatchDocument } from '../../schemas/match.schema';
import { Model } from 'mongoose';
import { NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';

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

  //new code
  async addQuestionToMatch(matchId: string, questionData: any): Promise<any> {
    const match = await this.matchModel.findById(matchId);
    if (!match) throw new NotFoundException('Match not found');

    const newQuestion = {
      _id: new Types.ObjectId().toString(),
      question: questionData.question,
      isVisible: true, // default value, you can customize
      result: '', // initially empty
      options: (questionData.options || []).map((opt) => ({
        _id: new Types.ObjectId().toString(),
        label: opt.label,
        ratio: opt.ratio,
      })),
    };

    match.questions.push(newQuestion);
    await match.save();

    return newQuestion;
  }

  async getQuestions(matchId: string): Promise<any[]> {
    const match = await this.matchModel.findById(matchId);
    if (!match) throw new NotFoundException('Match not found');

    return match.questions;
  }

  async editQuestion(matchId: string, questionId: string, newQuestion: string) {
    const updatedMatch = await this.matchModel.findOneAndUpdate(
      { _id: matchId, 'questions._id': questionId },
      {
        $set: { 'questions.$.question': newQuestion },
      },
      { new: true },
    );

    if (!updatedMatch)
      throw new NotFoundException('Match or Question not found');

    const updatedQuestion = updatedMatch.questions.find(
      (q) => q._id.toString() === questionId,
    );

    return updatedQuestion; // ✅ return only the updated question
  }

  async deleteQuestion(matchId: string, questionId: string) {
    const updatedMatch = await this.matchModel.findOneAndUpdate(
      { _id: matchId },
      {
        $pull: { questions: { _id: questionId } },
      },
      { new: true },
    );

    if (!updatedMatch) {
      throw new NotFoundException('Match or Question not found');
    }

    return { success: true, updatedMatch };
  }

  // match.service.ts
  async updateOption(
    matchId: string,
    questionId: string,
    optionId: string,
    body: { label?: string; ratio?: string },
  ) {
    const match = await this.matchModel.findById(matchId);
    if (!match) throw new NotFoundException('Match not found');

    // Find the question
    const question = match.questions.find(
      (q) => q._id.toString() === questionId,
    );
    if (!question) throw new NotFoundException('Question not found');

    // Find the option
    const option = question.options.find(
      (opt) => opt._id.toString() === optionId,
    );
    if (!option) throw new NotFoundException('Option not found');

    // Update fields
    if (body.label !== undefined) option.label = body.label;
    if (body.ratio !== undefined) option.ratio = body.ratio;

    await match.save();
    return { success: true, updatedMatch: match };
  }

  // match.service.ts
  async addOptionToQuestion(
    matchId: string,
    questionId: string,
    optionData: { label: string; ratio: string },
  ) {
    const match = await this.matchModel.findById(matchId);
    if (!match) throw new NotFoundException('Match not found');

    const question = match.questions.find(
      (q) => q._id.toString() === questionId,
    );
    if (!question) throw new NotFoundException('Question not found');

    const newOption = {
      _id: new Types.ObjectId().toString(),
      label: optionData.label,
      ratio: optionData.ratio,
    };

    question.options.push(newOption);
    await match.save();

    return newOption; // ✅ only return the added option
  }

  async deleteOptionFromQuestion(
    matchId: string,
    questionId: string,
    optionId: string,
  ) {
    const match = await this.matchModel.findById(matchId);
    if (!match) throw new NotFoundException('Match not found');

    const question = match.questions.find(
      (q) => q._id.toString() === questionId,
    );
    if (!question) throw new NotFoundException('Question not found');

    const originalLength = question.options.length;
    question.options = question.options.filter(
      (opt) => opt._id.toString() !== optionId,
    );

    if (question.options.length === originalLength)
      throw new NotFoundException('Option not found');

    await match.save();
    return { success: true, updatedMatch: match };
  }

  // match.service.ts
  async getQuestionsForMatch(matchId: string) {
    const match = await this.matchModel.findById(matchId).lean();
    if (!match) {
      throw new NotFoundException('Match not found');
    }
    return match.questions || [];
  }
}
