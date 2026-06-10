import * as fs from 'fs/promises';
import { MailAttachment, MailTransport, RawMailMessage } from './mail-transport.interface';

/** Connection options for the Postal HTTP API. */
export interface PostalTransportOptions {
  /** Base URL of your Postal server, e.g. `"https://postal.example.com"`. */
  serverUrl: string;
  /** Postal server API key. */
  apiKey: string;
}

interface PostalAttachment {
  name: string;
  content_type: string;
  data: string;
}

interface PostalApiResult {
  status: string;
  data?: {
    message?: string;
  };
}

/** Transport that delivers mail via the Postal HTTP API v1. */
export class PostalTransport implements MailTransport {
  private readonly apiUrl: string;
  private readonly apiKey: string;

  /**
   * Create a Postal HTTP transport.
   *
   * @param options - Postal API connection options.
   */
  constructor(options: PostalTransportOptions) {
    this.apiUrl = `${options.serverUrl.replace(/\/$/, '')}/api/v1/send/message`;
    this.apiKey = options.apiKey;
  }

  /**
   * Sends one mail message through the Postal HTTP API.
   *
   * @param message - Raw mail message to deliver.
   * @throws When Postal returns a non-success HTTP or API response.
   */
  async send(message: RawMailMessage): Promise<void> {
    const body: Record<string, unknown> = {
      to: Array.isArray(message.to) ? message.to : [message.to],
      from: message.from,
      subject: message.subject,
      html_body: message.html,
    };

    if (message.text) body['plain_body'] = message.text;
    if (message.replyTo) body['reply_to'] = message.replyTo;
    if (message.attachments?.length) {
      body['attachments'] = await Promise.all(message.attachments.map((attachment) => this.mapAttachment(attachment)));
    }

    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Server-API-Key': this.apiKey,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Postal HTTP error: ${response.status}`);
    }

    const result = (await response.json()) as PostalApiResult;
    if (result.status !== 'success') {
      throw new Error(`Postal API error: ${result.data?.message ?? result.status}`);
    }
  }

  private async mapAttachment(attachment: MailAttachment): Promise<PostalAttachment> {
    const content = attachment.path ? await fs.readFile(attachment.path) : (attachment.content ?? '');

    return {
      name: attachment.filename,
      content_type: attachment.contentType ?? 'application/octet-stream',
      data: Buffer.isBuffer(content) ? content.toString('base64') : Buffer.from(content).toString('base64'),
    };
  }
}
