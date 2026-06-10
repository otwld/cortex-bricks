type Configuration = {
  mongodb: { uri: string };
  jwt: { secret: string; refreshSecret: string };
  google: { clientId: string; clientSecret: string; callbackUrl: string };
  github: { clientId: string; clientSecret: string; callbackUrl: string };
  adminEmails: string[];
  frontendUrl: string;
  mail: {
    transport: 'postal' | 'smtp' | 'preview';
    postalServerUrl?: string;
    postalApiKey?: string;
    smtp: {
      host?: string;
      port?: number;
      secure: boolean;
      user?: string;
      password?: string;
    };
    mailpit: {
      host?: string;
      port: number;
    };
    from: string;
  };
  storage: {
    minio: {
      endpoint: string;
      port: number;
      useSsl: boolean;
      bucket: string;
      accessKey: string;
      secretKey: string;
    };
  };
  devAuth: { enabled: boolean; email?: string; password?: string };
  ai: {
    openaiApiKey?: string;
    chatModel: string;
    fastModel: string;
    structuredModel: string;
  };
};

/**
 * Builds the typed backend runtime configuration from validated environment
 * variables.
 *
 * `ConfigModule.forRoot` runs `validate` before this factory, so required
 * values are safe to read from `process.env` here.
 */
export const configuration = (): Configuration => ({
  mongodb: { uri: process.env['MONGODB_URI'] as string },
  jwt: {
    secret: process.env['JWT_SECRET'] as string,
    refreshSecret: process.env['JWT_REFRESH_SECRET'] as string,
  },
  google: {
    clientId: process.env['GOOGLE_CLIENT_ID'] as string,
    clientSecret: process.env['GOOGLE_CLIENT_SECRET'] as string,
    callbackUrl: process.env['GOOGLE_CALLBACK_URL'] as string,
  },
  github: {
    clientId: process.env['GITHUB_CLIENT_ID'] as string,
    clientSecret: process.env['GITHUB_CLIENT_SECRET'] as string,
    callbackUrl: process.env['GITHUB_CALLBACK_URL'] as string,
  },
  adminEmails: (process.env['ADMIN_EMAILS'] ?? '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean),
  frontendUrl: process.env['FRONTEND_URL'] as string,
  mail: {
    transport: (process.env['MAIL_TRANSPORT'] ?? 'postal') as 'postal' | 'smtp' | 'preview',
    postalServerUrl: process.env['POSTAL_SERVER_URL'],
    postalApiKey: process.env['POSTAL_API_KEY'],
    smtp: {
      host: process.env['SMTP_HOST'],
      port: process.env['SMTP_PORT'] ? Number(process.env['SMTP_PORT']) : undefined,
      secure: process.env['SMTP_SECURE'] === 'true',
      user: process.env['SMTP_USER'],
      password: process.env['SMTP_PASSWORD'],
    },
    mailpit: {
      host: process.env['MAILPIT_HOST'],
      port: process.env['MAILPIT_SMTP_PORT'] ? Number(process.env['MAILPIT_SMTP_PORT']) : 1025,
    },
    from: process.env['MAIL_FROM'] as string,
  },
  storage: {
    minio: {
      endpoint: process.env['MINIO_ENDPOINT'] as string,
      port: Number(process.env['MINIO_PORT']),
      useSsl: process.env['MINIO_USE_SSL'] === 'true',
      bucket: process.env['MINIO_BUCKET'] as string,
      accessKey: process.env['MINIO_ACCESS_KEY'] as string,
      secretKey: process.env['MINIO_SECRET_KEY'] as string,
    },
  },
  devAuth: {
    enabled: process.env['DEV_AUTH_ENABLED'] === 'true',
    email: process.env['DEV_AUTH_EMAIL'],
    password: process.env['DEV_AUTH_PASSWORD'],
  },
  ai: {
    openaiApiKey: process.env['OPENAI_API_KEY'],
    chatModel: process.env['AI_CHAT_MODEL'] ?? 'gpt-5.4',
    fastModel: process.env['AI_FAST_MODEL'] ?? 'gpt-5.4-mini',
    structuredModel: process.env['AI_STRUCTURED_MODEL'] ?? 'gpt-5.4',
  },
});
