import { DynamicModule, Module } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { JwtModule, JwtService } from '@nestjs/jwt';
import type { JwtSignOptions } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import {
  createNestFeatureAsyncOptionsClassProvider,
  createNestFeatureAsyncOptionsProvider,
} from '@otwld/nest-sdk';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { CaslAbilityFactory } from './casl/casl-ability.factory';
import {
  AUTH_MODULE_OPTIONS,
  AuthModuleAsyncOptions,
  AuthModuleOptions,
} from './config/auth-module-options';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { PoliciesGuard } from './guards/policies.guard';
import { GithubStrategy } from './strategies/github.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { RefreshTokenRepository } from './tokens/refresh-token.repository';
import { RefreshToken, RefreshTokenSchema } from './tokens/refresh-token.schema';
import { ACCESS_JWT_SERVICE, REFRESH_JWT_SERVICE, TokenService } from './tokens/token.service';
import { AuthAccountRepository } from './auth-account/auth-account.repository';
import { AuthAccount, AuthAccountSchema } from './auth-account/auth-account.schema';
import { AuthAccountService } from './auth-account/auth-account.service';

/**
 * Creates JWT sign options while preserving the library-supported TTL type.
 *
 * @param expiresIn - Access or refresh token time-to-live accepted by jsonwebtoken.
 * @returns Sign options for Nest JWT providers.
 */
function createJwtSignOptions(expiresIn: JwtSignOptions['expiresIn']): JwtSignOptions {
  return { expiresIn };
}

@Module({})
class AuthOptionsModule {
  static registerAsync(asyncOptions: AuthModuleAsyncOptions): DynamicModule {
    return {
      module: AuthOptionsModule,
      imports: asyncOptions.imports ?? [],
      providers: [
        createNestFeatureAsyncOptionsProvider(AUTH_MODULE_OPTIONS, asyncOptions, 'createAuthOptions'),
        ...createNestFeatureAsyncOptionsClassProvider(asyncOptions),
      ],
      exports: [AUTH_MODULE_OPTIONS],
    };
  }
}

/**
 * Configurable Nest auth module that wires user persistence, JWT, Passport, and CASL providers.
 *
 * @example
 * ```ts
 * AuthModule.forRoot({ jwtSecret, jwtRefreshSecret, abilityFactory: AppAbilityFactory });
 * ```
 */
@Module({})
export class AuthModule {
  /**
   * Builds the dynamic auth module from runtime options.
   *
   * @param options - Auth module configuration, secrets, strategy settings, and ability factory.
   * @returns A dynamic Nest module with auth controllers, providers, imports, and exports.
   * @example
   * ```ts
   * imports: [AuthModule.forRoot({ jwtSecret, jwtRefreshSecret, abilityFactory })]
   * ```
   */
  static forRoot(options: AuthModuleOptions): DynamicModule {
    const authAccountSchema = options.authAccountSchema ?? AuthAccountSchema;
    const accessTtl = options.accessTokenTtl ?? '15m';
    const refreshTtl = options.refreshTokenTtl ?? '7d';

    const strategies = options.strategies ?? ['local', 'jwt', 'google', 'github'];

    const strategyProviders = [
      LocalStrategy,
      JwtStrategy,
      ...(strategies.includes('google') && options.google ? [GoogleStrategy] : []),
      ...(strategies.includes('github') && options.github ? [GithubStrategy] : []),
    ];

    return {
      module: AuthModule,
      global: true,
      imports: [
        PassportModule,
        MongooseModule.forFeature([
          { name: AuthAccount.name, schema: authAccountSchema },
          { name: RefreshToken.name, schema: RefreshTokenSchema },
        ]),
        JwtModule.register({ secret: options.jwtSecret, signOptions: createJwtSignOptions(accessTtl) }),
      ],
      controllers: [AuthController],
      providers: [
        { provide: AUTH_MODULE_OPTIONS, useValue: options },
        {
          provide: ACCESS_JWT_SERVICE,
          useFactory: () =>
            new JwtService({ secret: options.jwtSecret, signOptions: createJwtSignOptions(accessTtl) }),
        },
        {
          provide: REFRESH_JWT_SERVICE,
          useFactory: () =>
            new JwtService({ secret: options.jwtRefreshSecret, signOptions: createJwtSignOptions(refreshTtl) }),
        },
        TokenService,
        AuthAccountRepository,
        AuthAccountService,
        RefreshTokenRepository,
        AuthService,
        { provide: CaslAbilityFactory, useClass: options.abilityFactory },
        JwtAuthGuard,
        PoliciesGuard,
        ...strategyProviders,
      ],
      exports: [AuthAccountRepository, AuthAccountService, CaslAbilityFactory, JwtAuthGuard, PoliciesGuard, TokenService],
    };
  }

  /**
   * Builds the dynamic auth module from async runtime options.
   *
   * @param asyncOptions - Async auth module configuration factory, class, or existing provider.
   * @returns A dynamic Nest module with auth controllers, providers, imports, and exports.
   */
  static forRootAsync(asyncOptions: AuthModuleAsyncOptions): DynamicModule {
    const optionsModule = AuthOptionsModule.registerAsync(asyncOptions);

    return {
      module: AuthModule,
      global: true,
      imports: [
        optionsModule,
        ...(asyncOptions.imports ?? []),
        PassportModule,
        MongooseModule.forFeatureAsync([
          {
            name: AuthAccount.name,
            imports: [optionsModule],
            useFactory: (options: AuthModuleOptions) => options.authAccountSchema ?? AuthAccountSchema,
            inject: [AUTH_MODULE_OPTIONS],
          },
          { name: RefreshToken.name, useFactory: () => RefreshTokenSchema },
        ]),
      ],
      controllers: [AuthController],
      providers: [
        {
          provide: ACCESS_JWT_SERVICE,
          useFactory: (options: AuthModuleOptions) =>
            new JwtService({
              secret: options.jwtSecret,
              signOptions: createJwtSignOptions(options.accessTokenTtl ?? '15m'),
            }),
          inject: [AUTH_MODULE_OPTIONS],
        },
        {
          provide: REFRESH_JWT_SERVICE,
          useFactory: (options: AuthModuleOptions) =>
            new JwtService({
              secret: options.jwtRefreshSecret,
              signOptions: createJwtSignOptions(options.refreshTokenTtl ?? '7d'),
            }),
          inject: [AUTH_MODULE_OPTIONS],
        },
        TokenService,
        AuthAccountRepository,
        AuthAccountService,
        RefreshTokenRepository,
        AuthService,
        {
          provide: CaslAbilityFactory,
          useFactory: (options: AuthModuleOptions, moduleRef: ModuleRef) => moduleRef.create(options.abilityFactory),
          inject: [AUTH_MODULE_OPTIONS, ModuleRef],
        },
        JwtAuthGuard,
        PoliciesGuard,
        LocalStrategy,
        JwtStrategy,
        {
          provide: GoogleStrategy,
          useFactory: (options: AuthModuleOptions, userService: AuthAccountService) => {
            const strategies = options.strategies ?? ['local', 'jwt', 'google', 'github'];
            if (!strategies.includes('google') || !options.google) return undefined;
            return new GoogleStrategy(options, userService);
          },
          inject: [AUTH_MODULE_OPTIONS, AuthAccountService],
        },
        {
          provide: GithubStrategy,
          useFactory: (options: AuthModuleOptions, userService: AuthAccountService) => {
            const strategies = options.strategies ?? ['local', 'jwt', 'google', 'github'];
            if (!strategies.includes('github') || !options.github) return undefined;
            return new GithubStrategy(options, userService);
          },
          inject: [AUTH_MODULE_OPTIONS, AuthAccountService],
        },
      ],
      exports: [AuthAccountRepository, AuthAccountService, CaslAbilityFactory, JwtAuthGuard, PoliciesGuard, TokenService],
    };
  }
}
