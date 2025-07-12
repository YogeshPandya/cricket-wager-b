// src/app.service.ts

import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  // This method returns a simple greeting
  getHello(): string {
    return 'Hello World!';
  }
}
