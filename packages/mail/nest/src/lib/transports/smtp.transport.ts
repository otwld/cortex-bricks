import * as nodemailer from 'nodemailer';
import type * as SMTPTransport from 'nodemailer/lib/smtp-transport';
import { MailTransport, RawMailMessage } from './mail-transport.interface';

/** Nodemailer SMTP connection options. */
export type SmtpTransportOptions = SMTPTransport.Options;

/** Transport that delivers mail via SMTP using Nodemailer. */
export class SmtpTransport implements MailTransport {
  private readonly transporter: nodemailer.Transporter;

  /**
   * Creates a smtp transport instance.
   *
   * @param options - options value.
   */
  constructor(options: SmtpTransportOptions) {
    this.transporter = nodemailer.createTransport(options);
  }

  /**
   * Runs send.
   *
   * @param message - message value.
   */
  async send(message: RawMailMessage): Promise<void> {
    await this.transporter.sendMail({
      to: message.to,
      from: message.from,
      subject: message.subject,
      html: message.html,
      text: message.text,
      replyTo: message.replyTo,
      attachments: message.attachments?.map((attachment) => ({
        filename: attachment.filename,
        content: attachment.content,
        path: attachment.path,
        contentType: attachment.contentType,
      })),
    });
  }
}
