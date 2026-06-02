import { validate } from './env.schema';

const baseEnv = {
  FRONTEND_URL: 'http://localhost:4200',
  GITHUB_CALLBACK_URL: 'http://localhost:3000/api/auth/github/callback',
  GITHUB_CLIENT_ID: 'github-client-id',
  GITHUB_CLIENT_SECRET: 'github-client-secret',
  GOOGLE_CALLBACK_URL: 'http://localhost:3000/api/auth/google/callback',
  GOOGLE_CLIENT_ID: 'google-client-id',
  GOOGLE_CLIENT_SECRET: 'google-client-secret',
  JWT_REFRESH_SECRET: 'test-refresh-secret',
  JWT_SECRET: 'test-secret',
  MAIL_FROM: 'noreply@example.test',
  MINIO_ACCESS_KEY: 'minio-access-key',
  MINIO_BUCKET: 'monorepo-starter-backend',
  MINIO_ENDPOINT: 'minio.local',
  MINIO_PORT: '80',
  MINIO_SECRET_KEY: 'minio-secret-key',
  MONGODB_URI: 'mongodb://localhost:27017/backend-test',
};

describe(validate.name, () => {
  it('accepts bundled preview mail transport without Postal settings', () => {
    const env = validate({
      ...baseEnv,
      MAIL_TRANSPORT: 'preview',
      MAILPIT_HOST: 'mailpit',
      MAILPIT_SMTP_PORT: '1025',
    });

    expect(env.MAIL_TRANSPORT).toBe('preview');
    expect(env.MAILPIT_HOST).toBe('mailpit');
    expect(env.MAILPIT_SMTP_PORT).toBe(1025);
  });

  it('requires Postal settings when Postal transport is selected', () => {
    expect(() =>
      validate({
        ...baseEnv,
        MAIL_TRANSPORT: 'postal',
      }),
    ).toThrow('POSTAL_SERVER_URL');
  });
});
