import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Admin, AdminDocument } from '../../schemas/admin.schema';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { CreateAdminDto } from './dto/create-admin.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(Admin.name) private adminModel: Model<AdminDocument>,
  ) {}

  async signup(data: CreateAdminDto): Promise<AdminDocument> {
    const existing = await this.adminModel.findOne({ email: data.email });
    if (existing) {
      throw new HttpException(
        'Admin with this email already exists.',
        HttpStatus.CONFLICT,
      );
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const newAdmin = new this.adminModel({
      username: data.username,
      email: data.email,
      password: hashedPassword,
      role: 'admin',
    });

    return await newAdmin.save(); // ✅ Return full document
  }

  async validateAdmin(
    email: string,
    password: string,
  ): Promise<AdminDocument | null> {
    const admin = await this.adminModel.findOne({ email });
    if (!admin) return null;

    const isMatch = await bcrypt.compare(password, admin.password);
    return isMatch ? admin : null;
  }
}
