import { MailTransport } from '../transports/mail-transport.interface';
import { MODULE_OPTIONS_TOKEN } from './mail.module-definition';

/** Injection token for the resolved MailModuleOptions. */
export const MAIL_MODULE_OPTIONS = MODULE_OPTIONS_TOKEN;

/** Runtime configuration for MailModule. */
export interface MailModuleOptions {
  /** Transport used to deliver messages. */
  transport: MailTransport;
  /** Default sender values applied to every outgoing message. */
  defaults: {
    /** Default From address, e.g. `"My App <noreply@example.com>"`. */
    from: string;
    /** Default Reply-To address. */
    replyTo?: string;
  };
  /** Template configuration. */
  templates: {
    /** Absolute path to the directory containing compiled Maizzle HTML files. */
    dir: string;
  };
}

export type {
  ASYNC_OPTIONS_TYPE as MailModuleAsyncOptions,
  OPTIONS_TYPE as MailModuleSyncOptions,
} from './mail.module-definition';

/** Factory interface for async module configuration via `useClass` / `useExisting`. */
export interface MailModuleOptionsFactory {
  createMailOptions(): Promise<MailModuleOptions> | MailModuleOptions;
}
