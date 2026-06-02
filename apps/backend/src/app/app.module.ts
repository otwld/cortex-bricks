import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule, JwtAuthGuard } from '@otwld/nest-auth';
import { AiModule, AiObjectSchemaRegistry, AiToolRegistry } from '@otwld/nest-ai';
import { MailModule, MailService, PostalTransport, PreviewTransport, SmtpTransport } from '@otwld/nest-mail';
import { StorageDriver } from '@otwld/ts-storage';
import { StorageModule, TusModule } from '@otwld/nest-storage';
import { UsersModule } from '@otwld/nest-users';
import * as path from 'path';
import { z } from 'zod';
import { configuration } from '../config/configuration';
import { validate } from '../config/env.schema';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppCaslAbilityFactory } from './casl/app-casl-ability.factory';
import { ChatModule } from './chat/chat.module';
import { StorageController } from './storage/storage.controller';

const websocketDemoOnly = process.env['WS_DEMO_ONLY'] === 'true';

const existingNonDemoImports = websocketDemoOnly
  ? []
  : [
      ConfigModule.forRoot({
        isGlobal: true,
        envFilePath: ['apps/backend/.env.local', 'apps/backend/.env'], // relative to monorepo root (CWD when running via nx serve)
        validate,
        load: [configuration],
      }),
      AiModule.forRootAsync({
        imports: [ConfigModule],
        endpoints: {
          controller: true,
          prefix: 'ai',
          guards: [JwtAuthGuard],
          limits: {
            maxMessageContentLength: 12_000,
            maxMessages: 40,
            maxOutputTokens: 2048,
            maxPromptLength: 12_000,
            maxToolSteps: 5,
          },
          quota: {
            enabled: true,
            storage: 'mongoose',
            defaultLimits: [{ window: { unit: 'hour', size: 1 }, maxTokens: 20_000 }],
            rules: [
              {
                roles: ['admin'],
                limits: [
                  { window: { unit: 'hour', size: 1 }, maxTokens: 100_000 },
                  { window: { unit: 'week', size: 1 }, maxTokens: 1_000_000 },
                ],
                maxPromptTokens: 16_000,
              },
              {
                roles: ['member'],
                limits: [
                  { window: { unit: 'hour', size: 5 }, maxTokens: 50_000 },
                  { window: { unit: 'week', size: 1 }, maxTokens: 200_000 },
                ],
                maxPromptTokens: 8_000,
              },
            ],
            maxPromptTokens: 8_000,
          },
        },
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          providers: {
            openai: {
              apiKey: config.get<string>('ai.openaiApiKey'),
            },
          },
          models: {
            chat: {
              providerModel: `openai:${config.getOrThrow<string>('ai.chatModel')}`,
              capabilities: ['chat', 'tools'],
            },
            fast: {
              providerModel: `openai:${config.getOrThrow<string>('ai.fastModel')}`,
              capabilities: ['completion'],
            },
            structured: {
              providerModel: `openai:${config.getOrThrow<string>('ai.structuredModel')}`,
              capabilities: ['object'],
            },
          },
        }),
      }),
      MongooseModule.forRootAsync({
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          uri: config.getOrThrow<string>('mongodb.uri'),
        }),
      }),
      StorageModule.forRootAsync({
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (config: ConfigService) => {
          const useSsl = config.getOrThrow<boolean>('storage.minio.useSsl');
          const endpoint = config.getOrThrow<string>('storage.minio.endpoint');
          const port = config.getOrThrow<number>('storage.minio.port');

          return {
            driver: StorageDriver.S3,
            s3: {
              bucket: config.getOrThrow<string>('storage.minio.bucket'),
              region: 'us-east-1',
              endpoint: `${useSsl ? 'https' : 'http'}://${endpoint}:${port}`,
              forcePathStyle: true,
              accessKeyId: config.getOrThrow<string>('storage.minio.accessKey'),
              secretAccessKey: config.getOrThrow<string>('storage.minio.secretKey'),
            },
          };
        },
      }),
      TusModule.forRoot({
        path: '/api/storage/tus',
        maxSize: 10 * 1024 * 1024 * 1024,
      }),
      MailModule.forRootAsync({
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (config: ConfigService) => {
          const transport = config.getOrThrow<'postal' | 'smtp' | 'preview'>('mail.transport');

          return {
            transport:
              transport === 'preview'
                ? new PreviewTransport({
                    host: config.getOrThrow<string>('mail.mailpit.host'),
                    port: config.get<number>('mail.mailpit.port') ?? 1025,
                  })
                : transport === 'smtp'
                  ? new SmtpTransport({
                      host: config.getOrThrow<string>('mail.smtp.host'),
                      port: config.get<number>('mail.smtp.port') ?? 587,
                      secure: config.get<boolean>('mail.smtp.secure') ?? false,
                      auth: config.get<string>('mail.smtp.user')
                        ? {
                            user: config.getOrThrow<string>('mail.smtp.user'),
                            pass: config.getOrThrow<string>('mail.smtp.password'),
                          }
                        : undefined,
                    })
                  : new PostalTransport({
                      serverUrl: config.getOrThrow<string>('mail.postalServerUrl'),
                      apiKey: config.getOrThrow<string>('mail.postalApiKey'),
                    }),
            defaults: {
              from: config.getOrThrow<string>('mail.from'),
            },
            templates: {
              dir: path.join(__dirname, 'mail/build'),
            },
          };
        },
      }),
      AuthModule.forRootAsync({
        imports: [ConfigModule],
        inject: [ConfigService, MailService],
        useFactory: (config: ConfigService, mailService: MailService) => ({
          jwtSecret: config.getOrThrow<string>('jwt.secret'),
          jwtRefreshSecret: config.getOrThrow<string>('jwt.refreshSecret'),
          abilityFactory: AppCaslAbilityFactory,
          strategies: ['local', 'jwt', 'google', 'github'],
          google: {
            clientId: config.getOrThrow<string>('google.clientId'),
            clientSecret: config.getOrThrow<string>('google.clientSecret'),
            callbackUrl: config.getOrThrow<string>('google.callbackUrl'),
          },
          github: {
            clientId: config.getOrThrow<string>('github.clientId'),
            clientSecret: config.getOrThrow<string>('github.clientSecret'),
            callbackUrl: config.getOrThrow<string>('github.callbackUrl'),
          },
          afterOAuthRedirect: '/dashboard',
          invitationOAuthRedirect: '/accept-invitation/oauth-complete',
          accessTokenTtl: '15m',
          refreshTokenTtl: '7d',
          devLogin: {
            enabled: config.get<boolean>('devAuth.enabled') ?? false,
            email: config.get<string>('devAuth.email') ?? 'developer@example.com',
            password: config.get<string>('devAuth.password') ?? '',
            firstName: 'Development',
            lastName: 'User',
            permissions: ['*'],
          },
          mail: {
            onRegistered: ({ email, name, verificationToken }) =>
              mailService.send({
                to: email,
                subject: 'Verify your email',
                template: 'welcome',
                context: {
                  name,
                  activationUrl: `${config.getOrThrow<string>('frontendUrl')}/verify-email?token=${verificationToken}`,
                },
              }),
            onForgotPassword: ({ email, name, resetToken }) =>
              mailService.send({
                to: email,
                subject: 'Reset your password',
                template: 'forgot-password',
                context: {
                  name,
                  resetUrl: `${config.getOrThrow<string>('frontendUrl')}/auth/reset-password?token=${resetToken}`,
                  expiresIn: '1 hour',
                },
              }),
            onPasswordReset: ({ email, name }) =>
              mailService.send({
                to: email,
                subject: 'Your password has been changed',
                template: 'reset-password',
                context: { name },
              }),
          },
        }),
      }),
      UsersModule.forRootAsync({
        imports: [ConfigModule],
        inject: [ConfigService, MailService],
        useFactory: (config: ConfigService, mailService: MailService) => ({
          frontendUrl: config.getOrThrow<string>('frontendUrl'),
          mail: {
            onInvitationCreated: ({ email, name, invitationUrl }) =>
              mailService.send({
                to: email,
                subject: 'You are invited',
                template: 'invitation',
                context: {
                  name,
                  invitationUrl,
                  expiresIn: '7 days',
                },
              }),
            onPasswordResetRequested: ({ email, name, resetToken }) =>
              mailService.send({
                to: email,
                subject: 'Reset your password',
                template: 'forgot-password',
                context: {
                  name,
                  resetUrl: `${config.getOrThrow<string>('frontendUrl')}/auth/reset-password?token=${resetToken}`,
                  expiresIn: '1 hour',
                },
              }),
            onPasswordReset: ({ email, name }) =>
              mailService.send({
                to: email,
                subject: 'Your password has been changed',
                template: 'reset-password',
                context: { name },
              }),
          },
        }),
      }),
    ];

const websocketDemoImports = websocketDemoOnly ? [ChatModule] : [];

const existingNonDemoProviders = websocketDemoOnly
  ? []
  : [
      {
        provide: 'AI_DEMO_REGISTRATION',
        inject: [AiObjectSchemaRegistry, AiToolRegistry],
        useFactory: (schemas: AiObjectSchemaRegistry, tools: AiToolRegistry) => {
          schemas.register(
            'summary',
            z.object({
              title: z.string(),
              bullets: z.array(z.string()),
              sentiment: z.enum(['positive', 'neutral', 'negative']),
            }),
          );

          tools.register({
            name: 'now',
            description: 'Return the current server timestamp',
            inputSchema: z.object({}),
            execute: () => ({ iso: new Date().toISOString() }),
          });

          return true;
        },
      },
    ];

/** Root backend application module. */
@Module({
  imports: [...existingNonDemoImports, ...websocketDemoImports],
  controllers: [AppController, ...(websocketDemoOnly ? [] : [StorageController])],
  providers: [AppService, ...existingNonDemoProviders],
})
export class AppModule {}
