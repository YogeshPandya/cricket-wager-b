import { Injectable, BadRequestException, UnauthorizedException, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from '../../schemas/user.schema';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
    constructor(
        @InjectModel(User.name) private userModel: Model<UserDocument>,
    ) { }

    async signup(data: any) {
        try {
            const hashedPassword = await bcrypt.hash(data.password, 10);
            const user = new this.userModel({ ...data, password: hashedPassword });
            await user.save();
            return user;
        } catch (error) {
            if (error.code === 11000) { // MongoDB duplicate key error code
                const duplicateField = Object.keys(error.keyPattern)[0];
                throw new HttpException(`User with this ${duplicateField} already exists.`, HttpStatus.CONFLICT);
            } else {
                throw new HttpException('Internal server error', HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
    }
}