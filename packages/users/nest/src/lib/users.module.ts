import { DynamicModule, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthAccount, AuthAccountRepository, AuthAccountSchema, AuthAccountService } from '@otwld/nest-auth';
import {
  createNestFeatureAsyncOptionsClassProvider,
  createNestFeatureAsyncOptionsProvider,
} from '@otwld/nest-sdk';
import {
  USERS_MODULE_OPTIONS,
  UsersModuleAsyncOptions,
  UsersModuleOptions,
} from './config/users-module-options';
import { UserInvitationRecord, UserInvitationSchema } from './schemas/user-invitation.schema';
import { UserProfileRecord, UserProfileSchema } from './schemas/user-profile.schema';
import { UserInvitationRepository } from './user-invitations.repository';
import { UsersController } from './users.controller';
import { UsersRepository } from './users.repository';
import { UsersService } from './users.service';

/** Reusable users backend module. */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AuthAccount.name, schema: AuthAccountSchema },
      { name: UserProfileRecord.name, schema: UserProfileSchema },
      { name: UserInvitationRecord.name, schema: UserInvitationSchema },
    ]),
  ],
  controllers: [UsersController],
  providers: [
    { provide: USERS_MODULE_OPTIONS, useValue: {} satisfies UsersModuleOptions },
    AuthAccountRepository,
    AuthAccountService,
    UsersRepository,
    UserInvitationRepository,
    UsersService,
  ],
  exports: [AuthAccountService, UsersRepository, UserInvitationRepository, UsersService],
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
      providers: [
        createNestFeatureAsyncOptionsProvider(USERS_MODULE_OPTIONS, asyncOptions, 'createUsersOptions'),
        ...createNestFeatureAsyncOptionsClassProvider(asyncOptions),
      ],
    };
  }
}
