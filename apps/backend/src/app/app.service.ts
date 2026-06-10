import { Injectable } from '@nestjs/common';

/**
 * Minimal application service used by the backend shell controller.
 */
@Injectable()
export class AppService {
  /**
   * Builds the backend shell status payload.
   */
  getData(): { message: string } {
    return { message: 'Hello API' };
  }
}
