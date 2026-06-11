import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { CheckPolicies, CurrentUser, JwtAuthGuard, PoliciesGuard, Public, AuthAccountDocument } from '@otwld/nest-auth';
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
  /** Create the users controller. */
  constructor(private readonly users: UsersService) {}

  /** Lists dashboard-managed users. */
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies(canReadUsers)
  @Get()
  list() {
    return this.users.list();
  }

  /** Creates a dashboard-managed invited user. */
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies(canManageUsers)
  @Post()
  create(@Body(new ZodValidationPipe(createUserRequestSchema)) body: CreateUserRequest) {
    return this.users.create(body);
  }

  /** Changes the current user's password. */
  @UseGuards(JwtAuthGuard)
  @Post('me/password')
  @HttpCode(HttpStatus.OK)
  changePassword(@CurrentUser() user: AuthAccountDocument, @Body(new ZodValidationPipe(changeUserPasswordRequestSchema)) body: ChangeUserPasswordRequest) {
    return this.users.changePassword(String(user._id), body);
  }

  /** Requests a password reset without exposing account existence. */
  @Public()
  @Post('password-reset/request')
  @HttpCode(HttpStatus.OK)
  requestPasswordReset(@Body(new ZodValidationPipe(requestUserPasswordResetRequestSchema)) body: RequestUserPasswordResetRequest) {
    return this.users.requestPasswordReset(body);
  }

  /** Completes a password reset with a raw reset token. */
  @Public()
  @Post('password-reset/complete')
  @HttpCode(HttpStatus.OK)
  resetPassword(@Body(new ZodValidationPipe(resetUserPasswordRequestSchema)) body: ResetUserPasswordRequest) {
    return this.users.resetPassword(body);
  }

  /** Reads invitation details. */
  @Public()
  @Get('invitations/:token')
  getInvitation(@Param('token') token: string) {
    return this.users.getInvitation(token);
  }

  /** Accepts invitation with local credentials. */
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
  @Public()
  @Get('invitations/:token/oauth/:provider')
  async startOAuth(@Param('token') token: string, @Param('provider', new ZodValidationPipe(userOAuthProviderSchema)) provider: UserOAuthProvider, @Res() res: Response) {
    const result = await this.users.startOAuth(token, provider);
    res.redirect(result.redirectPath);
  }

  /** Completes invitation OAuth with a single-use state returned by the auth callback. */
  @UseGuards(JwtAuthGuard)
  @Post('invitations/oauth/complete')
  @HttpCode(HttpStatus.OK)
  completeOAuthState(@Body(new ZodValidationPipe(completeInvitationOAuthRequestSchema)) body: CompleteInvitationOAuthRequest, @CurrentUser() user: AuthAccountDocument) {
    return this.users.completeOAuthState(body, String(user._id));
  }

  /** Completes invitation OAuth after auth callback redirects to the frontend completion route. */
  @UseGuards(JwtAuthGuard)
  @Post('invitations/:token/oauth/complete')
  @HttpCode(HttpStatus.OK)
  completeOAuth(@Param('token') token: string, @CurrentUser() user: AuthAccountDocument) {
    return this.users.completeOAuth(token, String(user._id));
  }

  /** Revokes an invitation token. */
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies(canManageUsers)
  @Post('invitations/:token/revoke')
  @HttpCode(HttpStatus.OK)
  revokeInvitation(@Param('token') token: string) {
    return this.users.revokeInvitation(token);
  }

  /** Loads one dashboard-managed user. */
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies(canReadUsers)
  @Get(':id')
  get(@Param('id') id: string) {
    return this.users.get(id);
  }

  /** Updates one dashboard-managed user. */
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies(canManageUsers)
  @Patch(':id')
  update(@Param('id') id: string, @Body(new ZodValidationPipe(updateUserRequestSchema)) body: UpdateUserRequest) {
    return this.users.update(id, body);
  }

  /** Soft deletes one dashboard-managed user. */
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies(canManageUsers)
  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.users.softDelete(id);
  }

  /** Resends an invitation. */
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies(canManageUsers)
  @Post(':id/resend-invitation')
  @HttpCode(HttpStatus.OK)
  resendInvitation(@Param('id') id: string) {
    return this.users.resendInvitation(id);
  }
}
