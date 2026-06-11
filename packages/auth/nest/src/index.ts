export { AuthModule } from './lib/auth.module';
export { AuthService } from './lib/auth.service';
export { CaslAbilityFactory } from './lib/casl/casl-ability.factory';
export { CheckPolicies } from './lib/casl/check-policies.decorator';
export { AnyPolicyHandler, PolicyHandler, PolicyHandlerFn } from './lib/casl/policy-handler';
export {
  AUTH_MODULE_OPTIONS,
  AuthMailForgotPasswordParams,
  AuthMailPasswordResetParams,
  AuthMailRegisteredParams,
  AuthMailVerificationResentParams,
  AuthModuleAsyncOptions,
  AuthModuleMailOptions,
  AuthModuleOptions,
} from './lib/config/auth-module-options';
export { CurrentUser } from './lib/decorators/current-user.decorator';
export { Public } from './lib/decorators/public.decorator';
export { GithubAuthGuard } from './lib/guards/github-auth.guard';
export { GoogleAuthGuard } from './lib/guards/google-auth.guard';
export { JwtAuthGuard } from './lib/guards/jwt-auth.guard';
export { LocalAuthGuard } from './lib/guards/local-auth.guard';
export { PoliciesGuard } from './lib/guards/policies.guard';
export { AuthAccount, AuthAccountDocument, AuthAccountSchema } from './lib/auth-account/auth-account.schema';
export { AuthAccountRepository } from './lib/auth-account/auth-account.repository';
export { AuthAccountService, type CreatePendingAuthAccount } from './lib/auth-account/auth-account.service';
