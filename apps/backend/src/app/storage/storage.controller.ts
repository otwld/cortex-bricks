import { Body, Controller, Inject, Post } from '@nestjs/common';
import { SignedUrlRequestDto } from '@otwld/ts-storage';
import { SignedUrlService } from '@otwld/nest-storage';

/**
 * Backend app adapter that exposes signed storage URLs to the frontend shell.
 */
@Controller('storage')
export class StorageController {
  constructor(@Inject(SignedUrlService) private readonly signedUrls: Pick<SignedUrlService, 'generate'>) {}

  /**
   * Creates a signed read URL for a storage object key.
   */
  @Post('signed-url')
  async createSignedUrl(@Body() body: SignedUrlRequestDto): Promise<{ url: string }> {
    return { url: await this.signedUrls.generate(body.key, { expiresIn: body.expiresIn }) };
  }
}
