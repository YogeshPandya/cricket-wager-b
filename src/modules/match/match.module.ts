import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Match, MatchSchema } from '../../schemas/match.schema';
import { MatchService } from './match.service';
import { MatchController } from './match.controller';
import { MatchGateway } from '../../gateway/match.gateway';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Match.name, schema: MatchSchema }]),
  ],
  controllers: [MatchController],
  providers: [MatchService, MatchGateway],
})
export class MatchModule {}
