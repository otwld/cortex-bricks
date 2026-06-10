import { createMongoAbility } from '@casl/ability';
import { DynamicModule, Provider } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Schema } from 'mongoose';
import { AuthModule } from './auth.module';
import { CaslAbilityFactory } from './casl/casl-ability.factory';
import {
  AUTH_MODULE_OPTIONS,
  AuthModuleOptions,
} from './config/auth-module-options';
import { User } from './user/user.schema';

class TestAbilityFactory extends CaslAbilityFactory {
  createForUser() {
    return createMongoAbility();
  }
}

describe(AuthModule.name, () => {
  it('makes configured auth guards and ability providers available to feature modules', () => {
    expect(
      AuthModule.forRoot({
        jwtSecret: 'access',
        jwtRefreshSecret: 'refresh',
        abilityFactory: TestAbilityFactory,
      }).global,
    ).toBe(true);

    expect(
      AuthModule.forRootAsync({
        useFactory: (): AuthModuleOptions => ({
          jwtSecret: 'access',
          jwtRefreshSecret: 'refresh',
          abilityFactory: TestAbilityFactory,
        }),
      }).global,
    ).toBe(true);
  });

  it('uses userSchema from async options for the User mongoose model', async () => {
    const customSchema = new Schema({ customField: String });
    const dynamicModule = AuthModule.forRootAsync({
      useFactory: (): AuthModuleOptions => ({
        jwtSecret: 'access',
        jwtRefreshSecret: 'refresh',
        abilityFactory: TestAbilityFactory,
        userSchema: customSchema,
      }),
    });

    const mongooseFeature = (dynamicModule.imports as DynamicModule[]).find(
      (imported) =>
        imported.module === MongooseModule &&
        imported.providers?.some(
          (provider) =>
            (provider as Provider & { provide?: string }).provide ===
            `${User.name}Model`,
        ),
    );
    const userModelProvider = mongooseFeature?.providers?.find(
      (provider) =>
        (provider as Provider & { provide?: string }).provide ===
        `${User.name}Model`,
    ) as Provider & {
      inject: unknown[];
      useFactory: (...args: unknown[]) => Promise<unknown>;
    };

    expect(userModelProvider.inject).toContain(AUTH_MODULE_OPTIONS);

    const fakeConnection = {
      models: {},
      model: vi.fn((_name: string, schema: Schema) => ({ schema })),
    };
    const model = (await userModelProvider.useFactory(fakeConnection, {
      userSchema: customSchema,
    })) as { schema: Schema };

    expect(model.schema).toBe(customSchema);
  });
});
