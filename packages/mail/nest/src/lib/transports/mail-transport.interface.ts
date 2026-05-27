/** Binary or text attachment included with a mail message. */
export interface MailAttachment {
  /** Filename shown in the email client. */
  filename: string;
  /** Text or binary content. Use `path` for large files instead. */
  content?: string | Buffer;
  /** Absolute file-system path to read the attachment from. */
  path?: string;
  /** MIME type, e.g. `application/pdf`. */
  contentType?: string;
}

/** Fully resolved message ready for delivery by a transport. */
export interface RawMailMessage {
  to: string | string[];
  from: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  attachments?: MailAttachment[];
}

/** Minimal contract every transport must implement. */
export interface MailTransport {
  send(message: RawMailMessage): Promise<void>;
}
