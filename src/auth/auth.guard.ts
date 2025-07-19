// src/auth/auth.guard.ts
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '../services/jwt.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException(
        'Authorization token missing or malformed',
      );
    }

    const token = authHeader.split(' ')[1];
    const decoded = this.jwtService.decodeToken(token);

    if (!decoded) {
      throw new UnauthorizedException('Invalid token');
    }

    req.user = decoded; // Attach decoded user info to request
    return true;
  }
}
