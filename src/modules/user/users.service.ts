import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from '../../schemas/user.schema';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  // ✅ Signup with individual duplicate checks
  async signup(data: CreateUserDto): Promise<UserDocument> {
    try {
      // Check for existing username
      const existingUsername = await this.userModel.findOne({ username: data.username });
      if (existingUsername) {
        throw new HttpException('Username already exists', HttpStatus.CONFLICT);
      }

      // Check for existing email
      const existingEmail = await this.userModel.findOne({ email: data.email });
      if (existingEmail) {
        throw new HttpException('Email already exists', HttpStatus.CONFLICT);
      }

      // Check for existing phone number
      const existingPhone = await this.userModel.findOne({ phoneNumber: data.phoneNumber });
      if (existingPhone) {
        throw new HttpException('Phone number already exists', HttpStatus.CONFLICT);
      }

      // Hash password and create user
      const hashedPassword = await bcrypt.hash(data.password, 10);

      const newUser = new this.userModel({
        ...data,
        password: hashedPassword,
      });

      return await newUser.save();
    } catch (error) {
      if (error instanceof HttpException) throw error;

      console.error('Signup error:', error);
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ✅ Validate login
  async validateUser(
    username: string,
    password: string,
  ): Promise<UserDocument | null> {
    const user = await this.userModel.findOne({ username });
    if (!user) return null;

    const isMatch = await bcrypt.compare(password, user.password);
    return isMatch ? user : null;
  }

  // ✅ Forgot password
  async forgotPassword(identifier: string): Promise<{ resetToken: string }> {
    const user = await this.userModel.findOne({
      $or: [{ username: identifier }, { email: identifier }],
    });

    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    const resetToken = Math.floor(100000 + Math.random() * 900000).toString();

    user.resetToken = resetToken;
    user.resetTokenExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 min
    await user.save();

    return { resetToken };
  }

  // ✅ Reset password with token
  async resetPassword(
    identifier: string,
    resetToken: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.userModel.findOne({
      $or: [{ username: identifier }, { email: identifier }],
    });

    if (!user || user.resetToken !== resetToken) {
      throw new HttpException(
        'Invalid identifier or reset token',
        HttpStatus.UNAUTHORIZED,
      );
    }

    if (!user.resetTokenExpires || user.resetTokenExpires < new Date()) {
      throw new HttpException('Reset token expired', HttpStatus.BAD_REQUEST);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetToken = null;
    user.resetTokenExpires = null;

    await user.save();
  }

  // ✅ Reset password using access token
  async resetLoginPassword(
    username: string,
    accessToken: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.userModel.findOne({ username });

    if (!user || user.resetToken !== accessToken) {
      throw new HttpException(
        'Invalid username or token',
        HttpStatus.UNAUTHORIZED,
      );
    }

    if (!user.resetTokenExpires || user.resetTokenExpires < new Date()) {
      throw new HttpException('Reset token expired', HttpStatus.BAD_REQUEST);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetToken = null;
    user.resetTokenExpires = null;

    await user.save();
  }

  // ✅ Admin dashboard: get all users
  async getAllUsers(): Promise<UserDocument[]> {
    return this.userModel
      .find({}, { password: 0, resetToken: 0, resetTokenExpires: 0 }) // exclude sensitive fields
      .sort({ createdAt: -1 })
      .exec();
  }
}
