import '@otwld/nest-mail';

declare module '@otwld/nest-mail' {
  interface MailTemplateMap {
    welcome: { name: string; activationUrl: string };
    invitation: { name: string; invitationUrl: string; expiresIn: string };
    'forgot-password': { name: string; resetUrl: string; expiresIn: string };
    'reset-password': { name: string };
  }
}
