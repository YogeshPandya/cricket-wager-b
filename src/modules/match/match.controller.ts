import {
  Controller,
  Post,
  Body,
  Get,
  Delete,
  Param,
  Patch,
} from '@nestjs/common';
import { MatchService } from './match.service';
import { MatchGateway } from '../../gateway/match.gateway';

@Controller('match')
export class MatchController {
  constructor(
    private readonly matchService: MatchService,
    private readonly matchGateway: MatchGateway,
  ) {}

  @Post('create')
  async createMatch(@Body() body: any) {
    const { teamA, teamB, ...rest } = body;

    if (!teamA || !teamB) {
      return {
        success: false,
        message: 'teamA and teamB are required',
      };
    }

    // const logoA = `https://flagcdn.com/w80/${teamA.toLowerCase()}.png`;
    // const logoB = `https://flagcdn.com/w80/${teamB.toLowerCase()}.png`;

    const match = await this.matchService.createMatch({
      teamA,
      teamB,
      ...rest,
    });

    this.matchGateway.matchCreated(match);

    return { success: true, match };
  }

  @Get()
  async getMatches() {
    return this.matchService.getAllMatches();
  }

  // match.controller.ts
  @Delete(':id')
  async deleteMatch(@Param('id') id: string) {
    const result = await this.matchService.deleteMatch(id);
    this.matchGateway.emitMatchDeleted(id); // ✅ Emit socket event
    return result;
  }

  //new code

  @Post(':matchId/add-question')
  async addQuestionToMatch(
    @Param('matchId') matchId: string,
    @Body() questionData: any,
  ) {
    const question = await this.matchService.addQuestionToMatch(
      matchId,
      questionData,
    );
    this.matchGateway.questionUpdated(matchId, question); // Optional: emit update
    return { success: true, question };
  }

  // PATCH /match/:matchId/edit-question/:questionId

  @Patch(':matchId/edit-question/:questionId')
  async editQuestion(
    @Param('matchId') matchId: string,
    @Param('questionId') questionId: string,
    @Body() body: { question: string },
  ) {
    const updatedQuestion = await this.matchService.editQuestion(
      matchId,
      questionId,
      body.question,
    );

    this.matchGateway.questionUpdated(matchId, updatedQuestion); // ✅ emit to client

    return updatedQuestion;
  }

  @Delete(':matchId/delete-question/:questionId')
  async deleteQuestion(
    @Param('matchId') matchId: string,
    @Param('questionId') questionId: string,
  ) {
    await this.matchService.deleteQuestion(matchId, questionId);

    this.matchGateway.questionDeleted(matchId, questionId); // ✅ emit deletion

    return { success: true };
  }

  // match.controller.ts
  @Patch(':matchId/edit-option/:questionId/:optionId')
  async updateOption(
    @Param('matchId') matchId: string,
    @Param('questionId') questionId: string,
    @Param('optionId') optionId: string,
    @Body() body: { label?: string; ratio?: string },
  ) {
    const result = await this.matchService.updateOption(
      matchId,
      questionId,
      optionId,
      body,
    );

    const updatedOption = result.updatedMatch.questions
      .find((q) => q._id.toString() === questionId)
      ?.options.find((o) => o._id.toString() === optionId);
    if (updatedOption) {
      // ✅ Emit full updatedQuestion too
      const updatedQuestion = result.updatedMatch.questions.find(
        (q) => q._id.toString() === questionId,
      );
      this.matchGateway.questionUpdated(matchId, updatedQuestion);
    }

    return result;
  }

  @Post(':matchId/add-option/:questionId')
  async addOption(
    @Param('matchId') matchId: string,
    @Param('questionId') questionId: string,
    @Body() optionData: { label: string; ratio: string },
  ) {
    const option = await this.matchService.addOptionToQuestion(
      matchId,
      questionId,
      optionData,
    );
    this.matchGateway.optionUpdated(matchId, questionId, option); // optional socket emit
    return { success: true, option };
  }

  @Delete(':matchId/delete-option/:questionId/:optionId')
  async deleteOption(
    @Param('matchId') matchId: string,
    @Param('questionId') questionId: string,
    @Param('optionId') optionId: string,
  ) {
    await this.matchService.deleteOptionFromQuestion(
      matchId,
      questionId,
      optionId,
    );
    this.matchGateway.optionDeleted(matchId, questionId, optionId);
    return { success: true };
  }

  @Get(':matchId/questions')
  async getQuestionsForMatch(@Param('matchId') matchId: string) {
    const questions = await this.matchService.getQuestionsForMatch(matchId);
    return questions;
  }

  //new code

  @Post(':matchId/place-bet')
  async placeBet(
    @Param('matchId') matchId: string,
    @Body()
    betData: {
      userId: string;
      questionId: string;
      optionId: string;
      amount: number;
    },
  ) {
    const bet = await this.matchService.placeBet(matchId, betData);
    return { success: true, bet };
  }

  @Get('user/:userId/bets')
  async getUserBets(@Param('userId') userId: string) {
    return this.matchService.getUserBets(userId);
  }
}
