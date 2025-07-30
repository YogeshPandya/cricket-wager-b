import { Controller, Post, Body, Get, Delete, Param } from '@nestjs/common';
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
}
