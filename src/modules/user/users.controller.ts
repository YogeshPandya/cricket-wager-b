import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Post,
  Req,
  Res,
  Patch,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { UserService } from './users.service';
import { JwtService } from 'src/services/jwt.service';
import sendResponse from 'src/common/sendResponse';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { RechargeRequestDto } from './dto/recharge-request.dto';
import { WithdrawDto } from './dto/withdraw.dto';

@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

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

  @Post('reset-login-password')
  async resetLoginPassword(
    @Body() body: ResetPasswordDto,
    @Res() res: Response,
  ) {
    try {
      const { username, accessToken, newPassword } = body;
      await this.userService.resetLoginPassword(
        username,
        accessToken,
        newPassword,
      );
      return res
        .status(HttpStatus.OK)
        .send(sendResponse('success.reset_password', {}, true));
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

  @Get('me')
  async getLoggedInUser(@Req() req: Request, @Res() res: Response) {
    try {
      const authHeader = req.headers['authorization'];
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res
          .status(HttpStatus.UNAUTHORIZED)
          .send(sendResponse('error.missing_token', {}, false));
      }

      const token = authHeader.split(' ')[1];
      const decoded = this.jwtService.decodeToken(token);
      if (!decoded || !decoded.id) {
        return res
          .status(HttpStatus.UNAUTHORIZED)
          .send(sendResponse('error.invalid_token', {}, false));
      }

      const user = await this.userService.getUserById(decoded.id);
      if (!user) {
        return res
          .status(HttpStatus.NOT_FOUND)
          .send(sendResponse('error.user_not_found', {}, false));
      }

      const userObj = user.toObject();
      delete userObj.password;

      return res
        .status(HttpStatus.OK)
        .send(sendResponse('success.user_details', { user: userObj }, true));
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .send(
          sendResponse(
            'error.fetch_user_failed',
            { error: error.message },
            false,
          ),
        );
    }
  }

  @Post('recharge')
  async submitRecharge(
    @Body('amount') amount: number,
    @Body('utr') utr: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      const authHeader = req.headers['authorization'];
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res
          .status(HttpStatus.UNAUTHORIZED)
          .send(sendResponse('error.missing_token', {}, false));
      }

      const token = authHeader.split(' ')[1];
      const decoded = this.jwtService.decodeToken(token);
      if (!decoded || !decoded.id) {
        return res
          .status(HttpStatus.UNAUTHORIZED)
          .send(sendResponse('error.invalid_token', {}, false));
      }

      const result = await this.userService.submitRechargeRequest(
        decoded.id,
        amount,
        utr,
      );
      if (!result.status && result.message === 'UTR_ALREADY_USED') {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .send(
            sendResponse(
              'error.utr_duplicate',
              { error: 'This UTR number has already been used.' },
              false,
            ),
          );
      }

      if (!result.status) {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .send(
            sendResponse(
              'error.recharge_failed',
              { error: result.message },
              false,
            ),
          );
      }

      return res
        .status(HttpStatus.OK)
        .send(sendResponse('success.recharge_submitted', {}, true));
    } catch (error) {
      const status =
        error instanceof HttpException
          ? error.getStatus()
          : HttpStatus.INTERNAL_SERVER_ERROR;
      return res
        .status(status)
        .send(
          sendResponse(
            'error.recharge_failed',
            { error: error.message },
            false,
          ),
        );
    }
  }

  @Post('recharge-request')
  async rechargeRequest(
    @Req() req: Request,
    @Body() body: RechargeRequestDto,
    @Res() res: Response,
  ) {
    try {
      const authHeader = req.headers['authorization'];
      if (!authHeader?.startsWith('Bearer ')) {
        return res
          .status(HttpStatus.UNAUTHORIZED)
          .send(sendResponse('error.missing_token', {}, false));
      }

      const token = authHeader.split(' ')[1];
      const decoded = this.jwtService.decodeToken(token);
      if (!decoded?.id) {
        return res
          .status(HttpStatus.UNAUTHORIZED)
          .send(sendResponse('error.invalid_token', {}, false));
      }

      const { amount, utr } = body;
      const result = await this.userService.submitRechargeRequest(
        decoded.id,
        amount,
        utr,
      );

      if (!result.status) {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .send(
            sendResponse(
              'error.recharge_request_failed',
              { error: result.message },
              false,
            ),
          );
      }

      return res
        .status(HttpStatus.OK)
        .send(sendResponse('success.recharge_request_submitted', {}, true));
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .send(
          sendResponse(
            'error.recharge_request_failed',
            { error: error.message },
            false,
          ),
        );
    }
  }

  @Get('/admin/recharges')
  async getRechargeRequests(@Res() res: Response) {
    try {
      const requests = await this.userService.getRechargeRequests();
      return res
        .status(HttpStatus.OK)
        .send(sendResponse('success.recharge_list', { requests }, true));
    } catch (error) {
      return res
        .status(500)
        .send(
          sendResponse(
            'error.fetch_recharges',
            { error: error.message },
            false,
          ),
        );
    }
  }

  @Patch('/admin/recharge-status')
  async updateRechargeStatus(
    @Body('username') username: string,
    @Body('utr') utr: string,
    @Body('status') status: 'Success' | 'Failed',
    @Res() res: Response,
  ) {
    try {
      await this.userService.updateRechargeStatus(username, utr, status);
      return res
        .status(HttpStatus.OK)
        .send(sendResponse('success.recharge_status_updated', {}, true));
    } catch (error) {
      const statusCode =
        error instanceof HttpException ? error.getStatus() : 500;
      return res
        .status(statusCode)
        .send(
          sendResponse(
            'error.update_status_failed',
            { error: error.message },
            false,
          ),
        );
    }
  }

  @Get('all')
  async getAllUsers(@Res() res: Response) {
    try {
      const users = await this.userService.getAllUsers();
      return res
        .status(HttpStatus.OK)
        .send(sendResponse('success.user_list', { users }, true));
    } catch (error) {
      return res
        .status(500)
        .send(
          sendResponse(
            'error.get_user_list_failed',
            { error: error.message },
            false,
          ),
        );
    }
  }

  // ✅ 👇 Add this at the bottom of UserController
  @Get('recharge-history')
  async getRechargeHistory(@Req() req: Request, @Res() res: Response) {
    try {
      const authHeader = req.headers['authorization'];
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res
          .status(401)
          .send(sendResponse('error.missing_token', {}, false));
      }

      const token = authHeader.split(' ')[1];
      const decoded = this.jwtService.decodeToken(token);
      if (!decoded || !decoded.id) {
        return res
          .status(401)
          .send(sendResponse('error.invalid_token', {}, false));
      }

      const rechargeHistory = await this.userService.getRechargeHistory(
        decoded.id,
      );

      return res
        .status(200)
        .send(
          sendResponse('success.recharge_history', { rechargeHistory }, true),
        );
    } catch (error) {
      return res
        .status(500)
        .send(
          sendResponse(
            'error.recharge_history_failed',
            { error: error.message },
            false,
          ),
        );
    }
  }

  // ✅ Protected route to submit withdrawal
  @Post('withdraw')
  async submitWithdraw(
    @Req() req: Request,
    @Body() body: WithdrawDto,
    @Res() res: Response,
  ) {
    try {
      const authHeader = req.headers['authorization'];
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res
          .status(HttpStatus.UNAUTHORIZED)
          .send(sendResponse('error.missing_token', {}, false));
      }

      const token = authHeader.split(' ')[1];
      const decoded = this.jwtService.decodeToken(token);

      if (!decoded || !decoded.id) {
        return res
          .status(HttpStatus.UNAUTHORIZED)
          .send(sendResponse('error.invalid_token', {}, false));
      }

      const { amount, upiId, holderName } = body;

      // Call service to submit withdraw request
      await this.userService.submitWithdraw(
        decoded.id,
        amount,
        upiId,
        holderName,
      );

      return res
        .status(HttpStatus.OK)
        .send(sendResponse('success.withdraw_submitted', {}, true));
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .send(
          sendResponse(
            'error.withdraw_failed',
            { error: error.message },
            false,
          ),
        );
    }
  }

  @Get('/admin/withdrawals')
  async getWithdrawals(@Res() res: Response) {
    try {
      const data = await this.userService.getAllWithdrawals(); // implement in service
      return res
        .status(HttpStatus.OK)
        .send(sendResponse('success.withdrawals_fetched', { data }, true));
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .send(
          sendResponse(
            'error.withdrawals_fetch_failed',
            { error: error.message },
            false,
          ),
        );
    }
  }

  @Patch('/admin/withdrawal-status')
  async updateWithdrawalStatus(
    @Body('username') username: string,
    @Body('createdAt') createdAt: string, // 🟢 match service param
    @Body('status') status: 'approved' | 'rejected',
    @Res() res: Response,
  ) {
    try {
      await this.userService.updateWithdrawStatus(username, createdAt, status);

      return res
        .status(HttpStatus.OK)
        .send(sendResponse('success.withdrawal_status_updated', {}, true));
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .send(
          sendResponse(
            'error.update_withdrawal_status_failed',
            { error: error.message },
            false,
          ),
        );
    }
  }
}
