import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

/**
 * Root backend health-style controller used by the development API shell.
 */
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  /**
   * Returns the backend shell status payload.
   */
  @Get()
  getData() {
    return this.appService.getData();
  }
}
