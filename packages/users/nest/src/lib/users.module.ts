import { DynamicModule, Module, Provider, Type } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '@otwld/nest-auth';
import { AuthAccountRepository } from './auth-account.repository';
import {
  USERS_MODULE_OPTIONS,
  UsersModuleAsyncOptions,
  UsersModuleOptions,
  UsersModuleOptionsFactory,
} from './config/users-module-options';
import { UserInvitationRecord, UserInvitationSchema } from './schemas/user-invitation.schema';
import { UserProfileRecord, UserProfileSchema } from './schemas/user-profile.schema';
import { UserInvitationRepository } from './user-invitations.repository';
import { UsersController } from './users.controller';
import { UsersRepository } from './users.repository';
import { UsersService } from './users.service';

function createAsyncOptionsProvider(asyncOptions: UsersModuleAsyncOptions): Provider {
  if (asyncOptions.useFactory) {
    return {
      provide: USERS_MODULE_OPTIONS,
      useFactory: asyncOptions.useFactory,
      inject: (asyncOptions.inject ?? []) as never[],
    };
  }

  const inject = (asyncOptions.useClass ?? asyncOptions.useExisting) as Type<UsersModuleOptionsFactory>;
  return {
    provide: USERS_MODULE_OPTIONS,
    useFactory: (factory: UsersModuleOptionsFactory) => factory.createUsersOptions(),
    inject: [inject],
  };
}

function createAsyncOptionsClassProvider(asyncOptions: UsersModuleAsyncOptions): Provider[] {
  if (!asyncOptions.useClass) return [];
  return [{ provide: asyncOptions.useClass, useClass: asyncOptions.useClass }];
}

/** Reusable users backend module. */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: UserProfileRecord.name, schema: UserProfileSchema },
      { name: UserInvitationRecord.name, schema: UserInvitationSchema },
    ]),
  ],
  controllers: [UsersController],
  providers: [
    { provide: USERS_MODULE_OPTIONS, useValue: {} satisfies UsersModuleOptions },
    AuthAccountRepository,
    UsersRepository,
    UserInvitationRepository,
    UsersService,
  ],
  exports: [AuthAccountRepository, UsersRepository, UserInvitationRepository, UsersService],
})
export class UsersModule {
  /** Configures the reusable users module with static options. */
  static forRoot(options: UsersModuleOptions = {}): DynamicModule {
    return {
      module: UsersModule,
      providers: [{ provide: USERS_MODULE_OPTIONS, useValue: options }],
    };
  }

  /** Configures the reusable users module with async options. */
  static forRootAsync(asyncOptions: UsersModuleAsyncOptions): DynamicModule {
    return {
      module: UsersModule,
      imports: asyncOptions.imports ?? [],
      providers: [createAsyncOptionsProvider(asyncOptions), ...createAsyncOptionsClassProvider(asyncOptions)],
    };
  }
}
