import { Module } from '@nestjs/common';
import { ConfigurableModuleClass } from './config/mail.module-definition';
import { MailService } from './mail.service';
import { TemplateInterpolator } from './templates/template-interpolator';
import { TemplateLoader } from './templates/template-loader';

/** Global NestJS module for transactional email. Register once in `AppModule`. */
@Module({
  providers: [MailService, TemplateLoader, TemplateInterpolator],
  exports: [MailService],
})
export class MailModule extends ConfigurableModuleClass {}
