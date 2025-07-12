// src/services/jwt.service.ts

import { Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class JwtService {
  /**
   * Generates a JWT access token for the given payload
   * @param payload - The data to encode in the token (e.g., user ID)
   * @returns signed JWT token
   */
  generateToken(payload: any): string {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not defined in environment variables.');
    }

    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });
  }

  /**
   * Decodes and verifies the JWT token
   * @param token - JWT token from client
   * @returns decoded payload or null if invalid
   */
  decodeToken(token: string): any {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      console.error('Error decoding JWT token:', error.message);
      return null;
    }
  }
}
