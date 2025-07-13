// src/app.module.ts

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { MongooseConfigService } from './config/mongoose.config';

import { UserModule } from './modules/user/users.module';
import { AdminModule } from './modules/admin/admin.module';

@Module({
  imports: [
    // ✅ Load environment variables from .env and make available across app
    ConfigModule.forRoot({ isGlobal: true }),

    // ✅ MongoDB connection setup using config service (uri, options, etc.)
    MongooseModule.forRootAsync({
      useClass: MongooseConfigService,
    }),

    // ✅ Project feature modules
    UserModule,
    AdminModule,
  ],
})
export class AppModule {}
