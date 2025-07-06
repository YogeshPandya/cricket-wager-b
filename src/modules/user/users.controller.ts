import { Body, Controller, HttpException, HttpStatus, Post, Res } from '@nestjs/common';
import { UserService } from './users.service';
import sendResponse from 'src/common/sendResponse';
import { __ } from 'i18n';
import { Response } from 'express';
import { JwtService } from 'src/services/jwt.service';

@Controller('user')
export class UserController {
    constructor(private readonly userService: UserService,private readonly jwtService: JwtService) { }

    @Post('signup')
   async signup(@Body() body: any, @Res() res: Response) {
        try {
            const user = await this.userService.signup(body);
            const token = this.jwtService.generateToken({ id: user._id, email: user.username });
            return res.status(HttpStatus.OK).send(sendResponse('success.user_signup', { user: user, access_token: token }, true));
        } catch (error) {
            const status = error instanceof HttpException ? error.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
            return res.status(status).send(
                sendResponse('error.signup_failed', { error: error.message }, false)
            );
        }
    }

}