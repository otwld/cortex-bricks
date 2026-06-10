import { Inject, Injectable } from '@nestjs/common';
import { MAIL_MODULE_OPTIONS, MailModuleOptions } from './config/mail-module-options';
import { TemplateInterpolator } from './templates/template-interpolator';
import { TemplateLoader } from './templates/template-loader';
import { MailAttachment } from './transports/mail-transport.interface';

// Empty by design: consumers add template names through TypeScript module augmentation.
/**
 * Describes mail template map values.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-empty-interface
export interface MailTemplateMap {}

/** Main service for sending templated and raw emails. */
@Injectable()
export class MailService {
  /**
   * Create the mail service.
   *
   * @param options - Resolved mail module configuration.
   * @param loader - Template loader used for named template sends.
   * @param interpolator - Template interpolator used to render context values.
   */
  constructor(
    @Inject(MAIL_MODULE_OPTIONS) private readonly options: MailModuleOptions,
    private readonly loader: TemplateLoader,
    private readonly interpolator: TemplateInterpolator,
  ) {}

  /**
   * Loads a compiled template, interpolates context, and sends via the configured transport.
   *
   * @param sendOptions - Templated email options.
   * @returns Resolves when the transport confirms delivery.
   */
  async send<K extends keyof MailTemplateMap>(sendOptions: {
    to: string | string[];
    subject: string;
    template: K;
    context: MailTemplateMap[K];
    from?: string;
    replyTo?: string;
    attachments?: MailAttachment[];
  }): Promise<void> {
    const html = await this.loader.load(this.options.templates.dir, sendOptions.template as string);
    const rendered = this.interpolator.interpolate(html, sendOptions.context as Record<string, unknown>);

    await this.options.transport.send({
      to: sendOptions.to,
      from: sendOptions.from ?? this.options.defaults.from,
      subject: sendOptions.subject,
      html: rendered,
      replyTo: sendOptions.replyTo ?? this.options.defaults.replyTo,
      attachments: sendOptions.attachments,
    });
  }

  /**
   * Sends an email with pre-rendered HTML, bypassing the template loader.
   *
   * @param rawOptions - Raw email options.
   * @returns Resolves when the transport confirms delivery.
   */
  async sendRaw(rawOptions: {
    to: string | string[];
    subject: string;
    html: string;
    text?: string;
    from?: string;
    replyTo?: string;
    attachments?: MailAttachment[];
  }): Promise<void> {
    await this.options.transport.send({
      to: rawOptions.to,
      from: rawOptions.from ?? this.options.defaults.from,
      subject: rawOptions.subject,
      html: rawOptions.html,
      text: rawOptions.text,
      replyTo: rawOptions.replyTo ?? this.options.defaults.replyTo,
      attachments: rawOptions.attachments,
    });
  }
}
