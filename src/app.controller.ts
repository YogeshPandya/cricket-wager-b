// src/app.controller.ts

import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  // Basic GET route for health check or welcome message
  @Get()
  getRootMessage(): string {
    return this.appService.getHello();
  }
}
