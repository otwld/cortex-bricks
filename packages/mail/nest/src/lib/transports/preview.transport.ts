import * as nodemailer from 'nodemailer';
import { MailTransport, RawMailMessage } from './mail-transport.interface';

/** Options for `PreviewTransport` when sending via Mailpit. */
export interface PreviewTransportOptions {
  /** Mailpit host, e.g. `"localhost"`. */
  host: string;
  /** Mailpit SMTP port. Defaults to `1025`. */
  port?: number;
}

/**
 * Development-only transport. Logs messages to the console by default.
 * When Mailpit options are provided, delivers to a local Mailpit instance.
 */
export class PreviewTransport implements MailTransport {
  private readonly mailpitOptions?: PreviewTransportOptions;

  /**
   * Create a preview transport.
   *
   * @param mailpit - Optional Mailpit SMTP connection options.
   */
  constructor(mailpit?: PreviewTransportOptions) {
    this.mailpitOptions = mailpit;
  }

  /**
   * Logs a message to the console or delivers it to Mailpit when configured.
   *
   * @param message - Raw mail message to preview.
   */
  async send(message: RawMailMessage): Promise<void> {
    if (!this.mailpitOptions) {
      console.log(`[nest-mail:preview] To: ${message.to} | Subject: ${message.subject}\n${message.html}`);
      return;
    }

    const transporter = nodemailer.createTransport({
      host: this.mailpitOptions.host,
      port: this.mailpitOptions.port ?? 1025,
    });

    await transporter.sendMail({
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
