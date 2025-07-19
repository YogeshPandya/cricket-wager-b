import { Injectable, HttpException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from '../../schemas/user.schema';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { NotFoundException } from '@nestjs/common';
import { BadRequestException } from '@nestjs/common';
import { UpdateUserInfoDto } from './dto/update-user-info.dto';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  // ✅ Signup with duplicate checks
  async signup(data: CreateUserDto): Promise<UserDocument> {
    const existing = await Promise.all([
      this.userModel.findOne({ username: data.username }),
      this.userModel.findOne({ email: data.email }),
      this.userModel.findOne({ phoneNumber: data.phoneNumber }),
    ]);
    if (existing[0]) throw new HttpException('Username already exists', 409);
    if (existing[1]) throw new HttpException('Email already exists', 409);
    if (existing[2])
      throw new HttpException('Phone number already exists', 409);

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const newUser = new this.userModel({ ...data, password: hashedPassword });
    return await newUser.save();
  }

  // ✅ Login validation
  async validateUser(
    username: string,
    password: string,
  ): Promise<UserDocument | null> {
    const user = await this.userModel.findOne({ username });
    if (!user) return null;

    const isMatch = await bcrypt.compare(password, user.password);
    return isMatch ? user : null;
  }

  // ✅ Forgot Password
  async forgotPassword(identifier: string): Promise<{ resetToken: string }> {
    const user = await this.userModel.findOne({
      $or: [{ username: identifier }, { email: identifier }],
    });
    if (!user) throw new HttpException('User not found', 404);

    const resetToken = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetToken = resetToken;
    user.resetTokenExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    return { resetToken };
  }

  // ✅ Reset with token
  async resetPassword(
    identifier: string,
    resetToken: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.userModel.findOne({
      $or: [{ username: identifier }, { email: identifier }],
    });
    if (!user || user.resetToken !== resetToken) {
      throw new HttpException('Invalid identifier or reset token', 401);
    }

    if (!user.resetTokenExpires || user.resetTokenExpires < new Date()) {
      throw new HttpException('Reset token expired', 400);
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetToken = null;
    user.resetTokenExpires = null;
    await user.save();
  }

  // ✅ Reset with login access token
  async resetLoginPassword(
    username: string,
    accessToken: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.userModel.findOne({ username });
    if (!user || user.resetToken !== accessToken) {
      throw new HttpException('Invalid username or token', 401);
    }

    if (!user.resetTokenExpires || user.resetTokenExpires < new Date()) {
      throw new HttpException('Reset token expired', 400);
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetToken = null;
    user.resetTokenExpires = null;
    await user.save();
  }

  // ✅ Admin: Get all users
  async getAllUsers(): Promise<UserDocument[]> {
    return this.userModel
      .find({}, { password: 0, resetToken: 0 })
      .sort({ createdAt: -1 })
      .exec();
  }

  // ✅ Get user by ID
  async getUserById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  // ✅ User submits recharge request (with UTR) — now with UTR uniqueness check
  async submitRechargeRequest(
    userId: string,
    amount: number,
    utr: string,
  ): Promise<{ status: boolean; message?: string }> {
    const user = await this.userModel.findById(userId);
    if (!user) throw new HttpException('User not found', 404);

    // ✅ Check if UTR already used by any user
    const utrUsed = await this.userModel.findOne({
      'rechargeHistory.utr': utr,
    });

    if (utrUsed) {
      return { status: false, message: 'UTR_ALREADY_USED' };
    }

    // ✅ Append to user's recharge history
    user.rechargeHistory.push({
      amount,
      utr,
      status: 'Pending',
      createdAt: new Date(),
    });

    await user.save();

    return { status: true };
  }

  // ✅ Admin: Get all recharge requests
  async getRechargeRequests(): Promise<any[]> {
    const users = await this.userModel
      .find(
        { 'rechargeHistory.0': { $exists: true } },
        { username: 1, rechargeHistory: 1 },
      )
      .lean();

    // Flatten the recharge requests
    const allRequests = users.flatMap((user) =>
      user.rechargeHistory.map((entry) => ({
        username: user.username,
        ...entry,
      })),
    );

    // Latest first
    return allRequests.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  // ✅ Admin approves or rejects a recharge
  async updateRechargeStatus(
    username: string,
    utr: string,
    status: 'Success' | 'Failed',
  ): Promise<void> {
    const user = await this.userModel.findOne({ username });
    if (!user) throw new HttpException('User not found', 404);

    const entry = user.rechargeHistory.find((r) => r.utr === utr);
    if (!entry) throw new HttpException('Recharge not found', 404);

    if (entry.status !== 'Pending') {
      throw new HttpException('Recharge already processed', 400);
    }

    entry.status = status;

    if (status === 'Success') {
      user.balance += entry.amount;
    }

    await user.save();
  }

  async getRechargeHistory(userId: string) {
    const user = await this.userModel.findById(userId).lean();
    if (!user) throw new Error('User not found');
    return user.rechargeHistory.reverse(); // latest first
  }

  // ✅ Submit Withdrawal Request
  async submitWithdraw(
    userId: string,
    amount: number,
    upiId: string,
    holderName: string,
  ) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const withdrawal = {
      amount,
      upiId,
      holderName, // ✅ NEW FIELD
      status: 'Pending' as const,
      createdAt: new Date(),
    };

    user.withdrawalHistory.push(withdrawal);
    await user.save();

    return {
      status: true,
      message: 'Withdrawal request submitted successfully',
    };
  }

  // ✅ Fetch All Withdrawal Requests for Admin
  async getAllWithdrawals() {
    const users = await this.userModel.find();
    const requests = [];

    users.forEach((user) => {
      user.withdrawalHistory.forEach((w) => {
        requests.push({
          username: user.username,
          amount: w.amount,
          upiId: w.upiId,
          holderName: w.holderName,
          status: w.status,
          createdAt: w.createdAt,
        });
      });
    });

    return {
      status: true,
      data: requests.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    };
  }

  // ✅ Update Withdrawal Status (Admin)
  async updateWithdrawStatus(
    username: string,
    createdAt: string,
    status: 'approved' | 'rejected',
  ) {
    const user = await this.userModel.findOne({ username });

    if (!user) throw new Error('User not found');

    const request = user.withdrawalHistory.find(
      (req) => req.createdAt.toISOString() === createdAt,
    );

    if (!request) throw new Error('Withdraw request not found');

    // ✅ Map string to valid enum
    request.status = status === 'approved' ? 'Success' : 'Failed';

    if (status === 'approved') {
      user.balance -= request.amount;
    }

    await user.save();
    return { message: 'Withdraw status updated' };
  }

  async getWithdrawalsByUsername(username: string) {
    const user = await this.userModel.findOne({ username }).lean();
    if (!user) throw new Error('User not found');
    return user.withdrawalHistory.reverse();
  }

  //userInfo
  async updateUser(userId: string, updateData: UpdateUserInfoDto) {
    const { username, email } = updateData;

    // Check if username is already taken by another user
    const existingUsername = await this.userModel.findOne({
      username,
      _id: { $ne: userId },
    });
    if (existingUsername) {
      throw new BadRequestException('Username already in use.');
    }

    // Check if email is already taken by another user
    const existingEmail = await this.userModel.findOne({
      email,
      _id: { $ne: userId },
    });
    if (existingEmail) {
      throw new BadRequestException('Email already in use.');
    }

    // Update the user
    return this.userModel
      .findByIdAndUpdate(userId, { username, email }, { new: true })
      .select('-password'); // hide password if you want
  }
}
