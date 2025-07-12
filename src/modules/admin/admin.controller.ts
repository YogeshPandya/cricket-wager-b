import { Controller, Post, Body, HttpStatus, Res } from '@nestjs/common';
import { Response } from 'express';
import { AdminService } from './admin.service';
import { JwtService } from 'src/services/jwt.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { LoginAdminDto } from './dto/login-admin.dto';
import sendResponse from 'src/common/sendResponse';

@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly jwtService: JwtService,
  ) {}

  @Post('signup')
  async signup(@Body() body: CreateAdminDto, @Res() res: Response) {
    try {
      const adminDoc = await this.adminService.signup(body);
      const admin = adminDoc.toObject();
      delete admin.password;

      const token = this.jwtService.generateToken({
        id: admin._id,
        email: admin.email,
      });

      return res
        .status(HttpStatus.OK)
        .send(
          sendResponse(
            'success.admin_signup',
            { admin, access_token: token },
            true,
          ),
        );
    } catch (error) {
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .send(
          sendResponse(
            'error.admin_signup_failed',
            { error: error.message },
            false,
          ),
        );
    }
  }

  @Post('login')
  async login(@Body() body: LoginAdminDto, @Res() res: Response) {
    try {
      const adminDoc = await this.adminService.validateAdmin(
        body.email,
        body.password,
      );

      if (!adminDoc) {
        return res
          .status(HttpStatus.UNAUTHORIZED)
          .send(sendResponse('error.invalid_credentials', {}, false));
      }

      const admin = adminDoc.toObject();
      delete admin.password;

      const token = this.jwtService.generateToken({
        id: admin._id,
        email: admin.email,
      });

      return res
        .status(HttpStatus.OK)
        .send(
          sendResponse(
            'success.admin_login',
            { admin, access_token: token },
            true,
          ),
        );
    } catch (error) {
      return res
        .status(error.status || HttpStatus.INTERNAL_SERVER_ERROR)
        .send(
          sendResponse(
            'error.admin_login_failed',
            { error: error.message },
            false,
          ),
        );
    }
  }
}
