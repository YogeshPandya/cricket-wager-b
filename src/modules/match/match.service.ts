import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Match, MatchDocument } from '../../schemas/match.schema';
import { Model } from 'mongoose';
import { NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { UserService } from '../user/users.service'; // ✅ Import UserService

@Injectable()
export class MatchService {
  constructor(
    @InjectModel(Match.name) private matchModel: Model<MatchDocument>,
    private readonly userService: UserService,
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

  //new code

  async placeBet(
    matchId: string,
    {
      userId,
      questionId,
      optionId,
      amount,
    }: {
      userId: string;
      questionId: string;
      optionId: string;
      amount: number;
    },
  ) {
    const match = await this.matchModel.findById(matchId);
    if (!match) throw new NotFoundException('Match not found');

    const question = match.questions.find(
      (q) => q._id.toString() === questionId,
    );
    if (!question) throw new NotFoundException('Question not found');

    const option = question.options.find((o) => o._id.toString() === optionId);
    if (!option) throw new NotFoundException('Option not found');

    await this.userService.deductBalance(userId, amount);

    // ✅ Ratio Calculation Logic (Directly Inside Service)
    const [num, den] = option.ratio.split('/').map(Number);
    let expectedReturn = 0;

    if (num && den) {
      const totalReturn = Math.round((amount * den) / num);
      const profit = totalReturn - amount;
      const commission = profit * 0.2;
      expectedReturn = Math.round(totalReturn - commission);
    }

    const bet = {
      userId: new Types.ObjectId(userId),
      matchId,
      questionId,
      optionId,
      optionLabel: option.label,
      question: question.question,
      ratio: option.ratio,
      amount,
      expectedReturn,
      betstatus: 'pending' as 'pending' | 'won' | 'lost',
    };

    match.bets.push(bet);
    await match.save();

    return bet;
  }

  // async getUserBets(userId: string) {
  //   const matches = await this.matchModel
  //     .find({
  //       'bets.userId': userId,
  //     })
  //     .lean();

  //   // Collect only bets of that user with their match, question, option etc.
  //   const userBets = [];

  //   for (const match of matches) {
  //     for (const bet of match.bets) {
  //       if (bet.userId.toString() === userId) {
  //         userBets.push({
  //           matchId: match._id,
  //           teamA: match.teamA,
  //           teamB: match.teamB,
  //           date: match.date,
  //           time: match.time,
  //           league: match.league,
  //           question: bet.question,
  //           option: bet.optionLabel,
  //           ratio: bet.ratio,
  //           amount: bet.amount,
  //           expectedReturn: bet.expectedReturn,
  //           betstatus: bet.betstatus,
  //         });
  //       }
  //     }
  //   }

  //   return userBets;
  // }

  async getUserBets(userId: string) {
    const matches = await this.matchModel
      .find({
        'bets.userId': userId,
      })
      .lean();

    const userBets = [];

    for (const match of matches) {
      for (const bet of match.bets) {
        if (bet.userId.toString() === userId) {
          const question = match.questions.find(
            (q) => q._id.toString() === bet.questionId.toString(),
          );

          // Determine status (prioritize stored status, then check result)
          let status = bet.betstatus;
          if (status === 'pending' && question?.result) {
            status =
              bet.optionLabel.toLowerCase() === question.result.toLowerCase()
                ? 'won'
                : 'lost';
          }

          userBets.push({
            matchId: match._id,
            teamA: match.teamA,
            teamB: match.teamB,
            date: match.date,
            time: match.time,
            league: match.league,
            question: bet.question,
            option: bet.optionLabel,
            ratio: bet.ratio,
            amount: bet.amount,
            expectedReturn: bet.expectedReturn,
            betstatus: status,
            result: question?.result || null, // Include result for reference
          });
        }
      }
    }

    return userBets;
  }

  //new code
  // In your MatchService, make sure the setQuestionResult method is properly implemented

  async setQuestionResult(matchId: string, questionId: string, result: string) {
    console.log('🔍 MatchService.setQuestionResult called:', {
      matchId,
      questionId,
      result,
    });

    try {
      const match = await this.matchModel.findById(matchId);
      if (!match) {
        console.error('❌ Match not found:', matchId);
        throw new NotFoundException('Match not found');
      }

      console.log('✅ Match found:', match._id);
      console.log('🔍 Looking for question:', questionId);
      console.log(
        '📝 Available questions:',
        match.questions.map((q) => ({
          id: q._id.toString(),
          question: q.question,
        })),
      );

      const question = match.questions.find(
        (q) => q._id.toString() === questionId,
      );

      if (!question) {
        console.error('❌ Question not found:', questionId);
        console.error(
          'Available question IDs:',
          match.questions.map((q) => q._id.toString()),
        );
        throw new NotFoundException('Question not found');
      }

      console.log('✅ Question found:', question.question);

      // Update question result
      question.result = result;
      console.log('✅ Question result updated to:', result);

      // Update all related bets
      const originalBetsCount = match.bets.length;
      let updatedBetsCount = 0;

      match.bets = match.bets.map((bet) => {
        if (bet.questionId.toString() === questionId) {
          const isWinner =
            bet.optionLabel.toLowerCase() === result.toLowerCase();
          updatedBetsCount++;

          console.log(
            `🎲 Bet Update: ${bet.optionLabel} vs ${result} = ${isWinner ? 'WON' : 'LOST'}`,
          );

          return {
            ...bet,
            betstatus: isWinner ? 'won' : 'lost',
          };
        }
        return bet;
      });

      console.log(
        `📊 Updated ${updatedBetsCount} bets out of ${originalBetsCount} total bets`,
      );

      const savedMatch = await match.save();
      console.log('✅ Match saved successfully');

      return savedMatch;
    } catch (error) {
      console.error('❌ Error in MatchService.setQuestionResult:', error);
      throw error;
    }
  }
}
