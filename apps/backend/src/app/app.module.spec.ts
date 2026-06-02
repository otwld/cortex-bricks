import { DynamicModule } from '@nestjs/common';
import { MODULE_METADATA } from '@nestjs/common/constants';
import { JwtAuthGuard } from '@otwld/nest-auth';
import { AI_ENDPOINT_OPTIONS } from '@otwld/nest-ai';
import { MailModule } from '@otwld/nest-mail';
import { USERS_MODULE_OPTIONS } from '@otwld/nest-users';
import { StorageDriver } from '@otwld/ts-storage';
import { STORAGE_MODULE_OPTIONS, TUS_MODULE_OPTIONS } from '@otwld/nest-storage';
import type { Mock } from 'vitest';
import { vi } from 'vitest';

interface AppModuleConfigStub {
  get<T>(key: string): T | undefined;
  getOrThrow<T>(key: string): T;
}

function createConfigStub(): AppModuleConfigStub {
  const values: Record<string, unknown> = {
    'devAuth.email': 'developer@example.com',
    'devAuth.enabled': false,
    'devAuth.password': '',
    'frontendUrl': 'http://localhost:4200',
    'github.callbackUrl': 'http://localhost:3000/auth/github/callback',
    'github.clientId': 'github-client-id',
    'github.clientSecret': 'github-client-secret',
    'google.callbackUrl': 'http://localhost:3000/auth/google/callback',
    'google.clientId': 'google-client-id',
    'google.clientSecret': 'google-client-secret',
    'jwt.refreshSecret': 'test-refresh-secret',
    'jwt.secret': 'test-secret',
  };

  return {
    get: <T,>(key: string) => values[key] as T | undefined,
    getOrThrow: <T,>(key: string) => values[key] as T,
  };
}

function normalizeModuleName(name: string | undefined): string | undefined {
  return name?.replace(/\d+$/, '');
}

function isDynamicModuleNamed(imported: unknown, name: string): imported is DynamicModule {
  return typeof imported === 'object' && imported !== null && normalizeModuleName((imported as DynamicModule).module?.name) === name;
}

function findDynamicModule(imports: unknown[], name: string): DynamicModule | undefined {
  return imports.find((imported): imported is DynamicModule => isDynamicModuleNamed(imported, name));
}

function findProvider<T>(providers: DynamicModule['providers'] | undefined, provide: unknown): T | undefined {
  return providers?.find((provider) => typeof provider === 'object' && provider !== null && 'provide' in provider && provider.provide === provide) as T | undefined;
}

Object.assign(process.env, {
  AI_CHAT_MODEL: 'gpt-5.4',
  AI_FAST_MODEL: 'gpt-5.4-mini',
  AI_STRUCTURED_MODEL: 'gpt-5.4',
  FRONTEND_URL: 'http://localhost:4200',
  GITHUB_CALLBACK_URL: 'http://localhost:3000/auth/github/callback',
  GITHUB_CLIENT_ID: 'github-client-id',
  GITHUB_CLIENT_SECRET: 'github-client-secret',
  GOOGLE_CALLBACK_URL: 'http://localhost:3000/auth/google/callback',
  GOOGLE_CLIENT_ID: 'google-client-id',
  GOOGLE_CLIENT_SECRET: 'google-client-secret',
  JWT_REFRESH_SECRET: 'test-refresh-secret',
  JWT_SECRET: 'test-secret',
  MAIL_FROM: 'noreply@example.test',
  MAIL_TRANSPORT: 'postal',
  MINIO_ACCESS_KEY: 'minio-access-key',
  MINIO_BUCKET: 'monorepo-starter-backend',
  MINIO_ENDPOINT: 'minio.local',
  MINIO_PORT: '80',
  MINIO_SECRET_KEY: 'minio-secret-key',
  MONGODB_URI: 'mongodb://localhost:27017/backend-test',
  POSTAL_API_KEY: 'postal-api-key',
  POSTAL_SERVER_URL: 'http://postal.local',
  WS_DEMO_ONLY: 'false',
});

describe('AppModule', () => {
  let imports: unknown[];

  beforeAll(async () => {
    const module = await import('./app.module');
    imports = Reflect.getMetadata(MODULE_METADATA.IMPORTS, module.AppModule) as unknown[];
  });

  it('does not import an unconfigured MailModule inside AuthModule async options', () => {
    const authModule = findDynamicModule(imports, 'AuthModule');

    expect(authModule).toBeDefined();
    expect(authModule.imports).not.toContain(MailModule);
  });

  it('builds auth password reset emails with the auth reset route', async () => {
    const authModule = findDynamicModule(imports, 'AuthModule');
    const authOptionsModule = findDynamicModule(authModule?.imports ?? [], 'AuthOptionsModule');
    const optionsProvider = findProvider<{
      provide: unknown;
      useFactory: (config: AppModuleConfigStub, mailService: { send: Mock }) => {
        mail: {
          onForgotPassword: (params: { email: string; name: string; resetToken: string }) => Promise<void>;
        };
      };
    }>(authOptionsModule?.providers, 'AUTH_MODULE_OPTIONS');
    const mailService = { send: vi.fn().mockResolvedValue(undefined) };

    const options = optionsProvider?.useFactory(createConfigStub(), mailService);
    await options?.mail.onForgotPassword({ email: 'ada@example.com', name: 'Ada', resetToken: 'reset-token' });

    expect(mailService.send).toHaveBeenCalledWith(
      expect.objectContaining({
        context: expect.objectContaining({
          resetUrl: 'http://localhost:4200/auth/reset-password?token=reset-token',
        }),
      }),
    );
  });

  it('protects AI sandbox endpoints with JWT auth and request limits', () => {
    const aiModule = findDynamicModule(imports, 'AiModule');
    const endpointProvider = aiModule?.providers?.find(
      (provider) => typeof provider === 'object' && provider !== null && 'provide' in provider && provider.provide === AI_ENDPOINT_OPTIONS,
    ) as { useValue: unknown } | undefined;

    expect(endpointProvider?.useValue).toEqual(
      expect.objectContaining({
        guards: [JwtAuthGuard],
        quota: expect.objectContaining({
          enabled: true,
          storage: 'mongoose',
          defaultLimits: expect.arrayContaining([expect.objectContaining({ maxTokens: expect.any(Number) })]),
        }),
        limits: expect.objectContaining({
          maxMessages: expect.any(Number),
          maxOutputTokens: expect.any(Number),
          maxPromptLength: expect.any(Number),
        }),
      }),
    );
  });

  it('configures backend storage for MinIO through the S3-compatible storage module', async () => {
    const storageModule = findDynamicModule(imports, 'StorageModule');
    const optionsProvider = storageModule?.providers?.find(
      (provider) => typeof provider === 'object' && provider !== null && 'provide' in provider && provider.provide === STORAGE_MODULE_OPTIONS,
    ) as { useFactory: (config: { getOrThrow: (key: string) => string | number | boolean }) => Promise<unknown> } | undefined;

    expect(optionsProvider).toBeDefined();

    const options = await optionsProvider?.useFactory({
      getOrThrow: (key: string) =>
        ({
          'storage.minio.bucket': 'monorepo-starter-backend',
          'storage.minio.endpoint': 'minio.ntrehout.otwld.lan',
          'storage.minio.port': 80,
          'storage.minio.useSsl': false,
          'storage.minio.accessKey': 'monorepo-starter-backend',
          'storage.minio.secretKey': 'secret',
        })[key] as string | number | boolean,
    });

    expect(options).toEqual(expect.objectContaining({
      driver: StorageDriver.S3,
      s3: expect.objectContaining({
        bucket: 'monorepo-starter-backend',
        region: 'us-east-1',
        endpoint: 'http://minio.ntrehout.otwld.lan:80',
        forcePathStyle: true,
        accessKeyId: 'monorepo-starter-backend',
        secretAccessKey: 'secret',
      }),
    }));
  });

  it('configures TUS upload locations with the global API prefix included', () => {
    const tusModule = findDynamicModule(imports, 'TusModule');
    const optionsProvider = tusModule?.providers?.find(
      (provider) => typeof provider === 'object' && provider !== null && 'provide' in provider && provider.provide === TUS_MODULE_OPTIONS,
    ) as { useValue: unknown } | undefined;

    expect(optionsProvider?.useValue).toEqual(expect.objectContaining({ path: '/api/storage/tus' }));
  });

  it('mounts the users management module', () => {
    const usersModule = findDynamicModule(imports, 'UsersModule');
    const optionsProvider = usersModule?.providers?.find(
      (provider) => typeof provider === 'object' && provider !== null && 'provide' in provider && provider.provide === USERS_MODULE_OPTIONS,
    ) as { useFactory: unknown } | undefined;

    expect(usersModule).toBeDefined();
    expect(optionsProvider?.useFactory).toBeDefined();
  });

  it('builds users password reset emails with the auth reset route', async () => {
    const usersModule = findDynamicModule(imports, 'UsersModule');
    const optionsProvider = findProvider<{
      provide: unknown;
      useFactory: (config: AppModuleConfigStub, mailService: { send: Mock }) => {
        mail: {
          onPasswordResetRequested: (params: { email: string; name: string; resetToken: string }) => Promise<void>;
        };
      };
    }>(usersModule?.providers, USERS_MODULE_OPTIONS);
    const mailService = { send: vi.fn().mockResolvedValue(undefined) };

    const options = optionsProvider?.useFactory(createConfigStub(), mailService);
    await options?.mail.onPasswordResetRequested({ email: 'ada@example.com', name: 'Ada', resetToken: 'reset-token' });

    expect(mailService.send).toHaveBeenCalledWith(
      expect.objectContaining({
        context: expect.objectContaining({
          resetUrl: 'http://localhost:4200/auth/reset-password?token=reset-token',
        }),
      }),
    );
  });
});
