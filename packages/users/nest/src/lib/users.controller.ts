import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { CheckPolicies, CurrentUser, JwtAuthGuard, PoliciesGuard, Public, UserDocument } from '@otwld/nest-auth';
import {
  AcceptInvitationCredentialsRequest,
  ChangeUserPasswordRequest,
  CompleteInvitationOAuthRequest,
  CreateUserRequest,
  RequestUserPasswordResetRequest,
  ResetUserPasswordRequest,
  UpdateUserRequest,
  UserOAuthProvider,
} from '@otwld/ts-users';
import {
  acceptInvitationCredentialsRequestSchema,
  changeUserPasswordRequestSchema,
  completeInvitationOAuthRequestSchema,
  createUserRequestSchema,
  requestUserPasswordResetRequestSchema,
  resetUserPasswordRequestSchema,
  updateUserRequestSchema,
  userOAuthProviderSchema,
} from './users-request.schemas';
import { UsersService } from './users.service';
import { canManageUsers, canReadUsers } from './users.policies';
import { ZodValidationPipe } from './zod-validation.pipe';

/** HTTP API for reusable user management. */
@Controller('users')
export class UsersController {
  /** Creates the users controller. */
  /**
   * Creates a users controller instance.
   *
   * @param users - users value.
   */
  constructor(private readonly users: UsersService) {}

  /** Lists dashboard-managed users. */
  /**
   * Runs list.
   *
   * @returns The users controller list result.
   */
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies(canReadUsers)
  @Get()
  list() {
    return this.users.list();
  }

  /** Creates a dashboard-managed invited user. */
  /**
   * Runs create.
   *
   * @param body - body value.
   *
   * @returns The users controller create result.
   */
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies(canManageUsers)
  @Post()
  create(@Body(new ZodValidationPipe(createUserRequestSchema)) body: CreateUserRequest) {
    return this.users.create(body);
  }

  /** Changes the current user's password. */
  /**
   * Runs change password.
   *
   * @param user - user value.
   *
   * @param body - body value.
   *
   * @returns The users controller change password result.
   */
  @UseGuards(JwtAuthGuard)
  @Post('me/password')
  @HttpCode(HttpStatus.OK)
  changePassword(@CurrentUser() user: UserDocument, @Body(new ZodValidationPipe(changeUserPasswordRequestSchema)) body: ChangeUserPasswordRequest) {
    return this.users.changePassword(String(user._id), body);
  }

  /** Requests a password reset without exposing account existence. */
  /**
   * Runs request password reset.
   *
   * @param body - body value.
   *
   * @returns The users controller request password reset result.
   */
  @Public()
  @Post('password-reset/request')
  @HttpCode(HttpStatus.OK)
  requestPasswordReset(@Body(new ZodValidationPipe(requestUserPasswordResetRequestSchema)) body: RequestUserPasswordResetRequest) {
    return this.users.requestPasswordReset(body);
  }

  /** Completes a password reset with a raw reset token. */
  /**
   * Runs reset password.
   *
   * @param body - body value.
   *
   * @returns The users controller reset password result.
   */
  @Public()
  @Post('password-reset/complete')
  @HttpCode(HttpStatus.OK)
  resetPassword(@Body(new ZodValidationPipe(resetUserPasswordRequestSchema)) body: ResetUserPasswordRequest) {
    return this.users.resetPassword(body);
  }

  /** Reads invitation details. */
  /**
   * Runs get invitation.
   *
   * @param token - token value.
   *
   * @returns The users controller get invitation result.
   */
  @Public()
  @Get('invitations/:token')
  getInvitation(@Param('token') token: string) {
    return this.users.getInvitation(token);
  }

  /** Accepts invitation with local credentials. */
  /**
   * Runs accept credentials.
   *
   * @param token - token value.
   *
   * @param body - body value.
   *
   * @returns The users controller accept credentials result.
   */
  @Public()
  @Post('invitations/:token/credentials')
  @HttpCode(HttpStatus.OK)
  acceptCredentials(
    @Param('token') token: string,
    @Body(new ZodValidationPipe(acceptInvitationCredentialsRequestSchema)) body: AcceptInvitationCredentialsRequest,
  ) {
    return this.users.acceptCredentials(token, body);
  }

  /** Starts invitation OAuth by generating state and redirecting to auth. */
  /**
   * Runs start oauth.
   *
   * @param token - token value.
   *
   * @param provider - provider value.
   *
   * @param res - res value.
   */
  @Public()
  @Get('invitations/:token/oauth/:provider')
  async startOAuth(@Param('token') token: string, @Param('provider', new ZodValidationPipe(userOAuthProviderSchema)) provider: UserOAuthProvider, @Res() res: Response) {
    const result = await this.users.startOAuth(token, provider);
    res.redirect(result.redirectPath);
  }

  /** Completes invitation OAuth with a single-use state returned by the auth callback. */
  /**
   * Runs complete oauth state.
   *
   * @param body - body value.
   *
   * @param user - user value.
   *
   * @returns The users controller complete oauth state result.
   */
  @UseGuards(JwtAuthGuard)
  @Post('invitations/oauth/complete')
  @HttpCode(HttpStatus.OK)
  completeOAuthState(@Body(new ZodValidationPipe(completeInvitationOAuthRequestSchema)) body: CompleteInvitationOAuthRequest, @CurrentUser() user: UserDocument) {
    return this.users.completeOAuthState(body, String(user._id));
  }

  /** Completes invitation OAuth after auth callback redirects to the frontend completion route. */
  /**
   * Runs complete oauth.
   *
   * @param token - token value.
   *
   * @param user - user value.
   *
   * @returns The users controller complete oauth result.
   */
  @UseGuards(JwtAuthGuard)
  @Post('invitations/:token/oauth/complete')
  @HttpCode(HttpStatus.OK)
  completeOAuth(@Param('token') token: string, @CurrentUser() user: UserDocument) {
    return this.users.completeOAuth(token, String(user._id));
  }

  /** Revokes an invitation token. */
  /**
   * Runs revoke invitation.
   *
   * @param token - token value.
   *
   * @returns The users controller revoke invitation result.
   */
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies(canManageUsers)
  @Post('invitations/:token/revoke')
  @HttpCode(HttpStatus.OK)
  revokeInvitation(@Param('token') token: string) {
    return this.users.revokeInvitation(token);
  }

  /** Loads one dashboard-managed user. */
  /**
   * Runs get.
   *
   * @param id - id value.
   *
   * @returns The users controller get result.
   */
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies(canReadUsers)
  @Get(':id')
  get(@Param('id') id: string) {
    return this.users.get(id);
  }

  /** Updates one dashboard-managed user. */
  /**
   * Runs update.
   *
   * @param id - id value.
   *
   * @param body - body value.
   *
   * @returns The users controller update result.
   */
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies(canManageUsers)
  @Patch(':id')
  update(@Param('id') id: string, @Body(new ZodValidationPipe(updateUserRequestSchema)) body: UpdateUserRequest) {
    return this.users.update(id, body);
  }

  /** Soft deletes one dashboard-managed user. */
  /**
   * Runs delete.
   *
   * @param id - id value.
   *
   * @returns The users controller delete result.
   */
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies(canManageUsers)
  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.users.softDelete(id);
  }

  /** Resends an invitation. */
  /**
   * Runs resend invitation.
   *
   * @param id - id value.
   *
   * @returns The users controller resend invitation result.
   */
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies(canManageUsers)
  @Post(':id/resend-invitation')
  @HttpCode(HttpStatus.OK)
  resendInvitation(@Param('id') id: string) {
    return this.users.resendInvitation(id);
  }
}
