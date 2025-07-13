// src/modules/user/users.controller.ts

import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Post,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { UserService } from './users.service';
import { JwtService } from 'src/services/jwt.service';
import sendResponse from 'src/common/sendResponse';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  // ✅ GET all users (for Admin Dashboard)
  @Get('all')
  async getAllUsers(@Res() res: Response) {
    try {
      const users = await this.userService.getAllUsers();
      return res
        .status(HttpStatus.OK)
        .send(sendResponse('success.user_list', { users }, true));
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .send(
          sendResponse(
            'error.get_user_list_failed',
            { error: error.message },
            false,
          ),
        );
    }
  }

  // ✅ Signup
  @Post('signup')
  async signup(@Body() body: CreateUserDto, @Res() res: Response) {
    try {
      const user = await this.userService.signup(body);

      const token = this.jwtService.generateToken({
        id: user._id,
        username: user.username,
      });

      return res
        .status(HttpStatus.OK)
        .send(
          sendResponse(
            'success.user_signup',
            { user, access_token: token },
            true,
          ),
        );
    } catch (error) {
      const status =
        error instanceof HttpException
          ? error.getStatus()
          : HttpStatus.INTERNAL_SERVER_ERROR;

      return res
        .status(status)
        .send(
          sendResponse('error.signup_failed', { error: error.message }, false),
        );
    }
  }

  // ✅ Login
  @Post('login')
  async login(@Body() body: LoginUserDto, @Res() res: Response) {
    try {
      const user = await this.userService.validateUser(
        body.username,
        body.password,
      );

      if (!user) {
        return res
          .status(HttpStatus.UNAUTHORIZED)
          .send(sendResponse('error.invalid_credentials', {}, false));
      }

      const token = this.jwtService.generateToken({
        id: user._id,
        username: user.username,
      });

      return res
        .status(HttpStatus.OK)
        .send(
          sendResponse(
            'success.user_login',
            { user, access_token: token },
            true,
          ),
        );
    } catch (error) {
      const status =
        error instanceof HttpException
          ? error.getStatus()
          : HttpStatus.INTERNAL_SERVER_ERROR;

      return res
        .status(status)
        .send(
          sendResponse('error.login_failed', { error: error.message }, false),
        );
    }
  }

  // ✅ Forgot Password (generate reset token)
  @Post('forgot-password')
  async forgotPassword(
    @Body('identifier') identifier: string,
    @Res() res: Response,
  ) {
    try {
      const result = await this.userService.forgotPassword(identifier);

      return res
        .status(HttpStatus.OK)
        .send(sendResponse('success.forgot_password', result, true));
    } catch (error) {
      const status =
        error instanceof HttpException
          ? error.getStatus()
          : HttpStatus.INTERNAL_SERVER_ERROR;

      return res
        .status(status)
        .send(
          sendResponse(
            'error.forgot_password_failed',
            { error: error.message },
            false,
          ),
        );
    }
  }

  // ✅ Reset Login Password (with token)
  @Post('reset-login-password')
  async resetLoginPassword(
    @Body() body: ResetPasswordDto,
    @Res() res: Response,
  ) {
    try {
      const { username, accessToken, newPassword } = body;

      const result = await this.userService.resetLoginPassword(
        username,
        accessToken,
        newPassword,
      );

      return res
        .status(HttpStatus.OK)
        .send(sendResponse('success.reset_password', result, true));
    } catch (error) {
      const status =
        error instanceof HttpException
          ? error.getStatus()
          : HttpStatus.INTERNAL_SERVER_ERROR;

      return res
        .status(status)
        .send(
          sendResponse(
            'error.reset_password_failed',
            { error: error.message },
            false,
          ),
        );
    }
  }
}
