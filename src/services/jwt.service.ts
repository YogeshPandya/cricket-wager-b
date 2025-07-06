import { Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class JwtService {


  /**
   *
   * @param payload
   * @returns
   */
  generateToken(payload: any): string {
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d'});
  }

  /**
   *
   * @param token
   * @returns
   */
  decodeToken(token: string): any {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      console.error('Error decoding JWT token:', error);
      return null;
    }
  }
}
