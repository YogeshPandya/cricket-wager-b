import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from '../../schemas/user.schema';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async signup(data: CreateUserDto): Promise<UserDocument> {
    try {
      const hashedPassword = await bcrypt.hash(data.password, 10);
      const newUser = new this.userModel({
        ...data,
        password: hashedPassword,
      });
      return await newUser.save();
    } catch (error) {
      if (error.code === 11000) {
        const duplicateField = Object.keys(error.keyPattern)[0];
        throw new HttpException(
          `User with this ${duplicateField} already exists.`,
          HttpStatus.CONFLICT,
        );
      }
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async validateUser(
    username: string,
    password: string,
  ): Promise<UserDocument | null> {
    const user = await this.userModel.findOne({ username });
    if (!user) return null;

    const isMatch = await bcrypt.compare(password, user.password);
    return isMatch ? user : null;
  }

  // ✅ Forgot password: generate token
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

  // ✅ Reset password by identifier + token
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

  // ✅ Reset Login Password (username + token)
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
}
