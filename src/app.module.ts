// src/app.module.ts

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { MongooseConfigService } from './config/mongoose.config';
import { UserModule } from './modules/user/users.module';
import { AdminModule } from './modules/admin/admin.module';

@Module({
  imports: [
    // ✅ Load environment variables and make them globally accessible
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // ✅ Asynchronously connect to MongoDB using MongooseConfigService
    MongooseModule.forRootAsync({
      useClass: MongooseConfigService,
    }),

    // ✅ Import user module (login/signup)
    UserModule,
    AdminModule,
  ],
})
export class AppModule {}
