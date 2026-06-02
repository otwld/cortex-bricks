import { Body, Controller, Post } from '@nestjs/common';
import { SignedUrlRequestDto } from '@otwld/ts-storage';
import { SignedUrlService } from '@otwld/nest-storage';

@Controller('storage')
export class StorageController {
  constructor(private readonly signedUrls: SignedUrlService) {}

  @Post('signed-url')
  async createSignedUrl(@Body() body: SignedUrlRequestDto): Promise<{ url: string }> {
    return { url: await this.signedUrls.generate(body.key, { expiresIn: body.expiresIn }) };
  }
}
