import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../../schemas/user.schema';
import { UserService } from './users.service';
import { UserController } from './users.controller';
import { JwtService } from 'src/services/jwt.service'; // custom JWT service

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  controllers: [UserController],
  providers: [UserService, JwtService], // ✅ move JwtService here
  exports: [UserService], // optional if needed elsewhere
})
export class UserModule {}
