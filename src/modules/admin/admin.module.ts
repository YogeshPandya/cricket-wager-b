// src/modules/admin/admin.module.ts

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Admin, AdminSchema } from '../../schemas/admin.schema';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { JwtService } from 'src/services/jwt.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Admin.name, schema: AdminSchema }]),
  ],
  controllers: [AdminController],
  providers: [AdminService, JwtService],
})
export class AdminModule {}
