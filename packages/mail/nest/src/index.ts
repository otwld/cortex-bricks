export { MailModule } from './lib/mail.module';
export { MailService, MailTemplateMap, MailTemplateRegistry } from './lib/mail.service';
export {
  MAIL_MODULE_OPTIONS,
  MailModuleAsyncOptions,
  MailModuleOptions,
  MailModuleOptionsFactory,
  MailModuleSyncOptions,
} from './lib/config/mail-module-options';
export { MailAttachment, MailTransport, RawMailMessage } from './lib/transports/mail-transport.interface';
export { PostalTransport, PostalTransportOptions } from './lib/transports/postal.transport';
export { PreviewTransport, PreviewTransportOptions } from './lib/transports/preview.transport';
export { SmtpTransport, SmtpTransportOptions } from './lib/transports/smtp.transport';
