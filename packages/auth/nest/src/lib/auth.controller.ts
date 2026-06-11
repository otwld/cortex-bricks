import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import {
  DevLoginBody,
  devLoginBodySchema,
  ForgotPasswordBody,
  forgotPasswordBodySchema,
  RegisterBody,
  registerBodySchema,
  ResetPasswordBody,
  resetPasswordBodySchema,
  VerifyEmailBody,
  verifyEmailBodySchema,
} from './auth-body.schemas';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { GithubAuthGuard } from './guards/github-auth.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { AuthAccountDocument } from './auth-account/auth-account.schema';
import { ZodValidationPipe } from './zod-validation.pipe';

/**
 * HTTP controller exposing registration, session, OAuth, and verification routes.
 *
 * @example
 * ```ts
 * // Mounted by AuthModule under the /auth route prefix.
 * ```
 */
@Controller('auth')
export class AuthController {
  /**
   * Creates an auth controller with the auth workflow service.
   *
   * @param authService - Service that implements the controller's auth flows.
   * @example
   * ```ts
   * const controller = new AuthController(authService);
   * ```
   */
  constructor(private readonly authService: AuthService) {}

  /**
   * Registers a local email/password account.
   *
   * @param body - Registration payload from the request body.
   * @returns The created user document.
   * @throws BadRequestException Propagated when the email is already registered.
   * @example
   * ```ts
   * await controller.register({ email: 'user@example.com', password: 'secret' });
   * ```
   */
  @Public()
  @Post('register')
  register(@Body(new ZodValidationPipe(registerBodySchema)) body: RegisterBody) {
    return this.authService.register(body);
  }

  /**
   * Creates an auth session after the local passport guard validates credentials.
   *
   * @param user - Authenticated user supplied by the local strategy.
   * @param res - Response used to set auth cookies.
   * @param req - Request used to capture user-agent and IP metadata.
   * @returns The authenticated user document.
   * @example
   * ```ts
   * await controller.login(user, response, request);
   * ```
   */
  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@CurrentUser() user: AuthAccountDocument, @Res({ passthrough: true }) res: Response, @Req() req: Request) {
    return this.authService.login(user, res, req.headers['user-agent'], req.ip);
  }

  /**
   * Creates a normal auth session for the configured development account.
   *
   * @param body - Development credential payload from the request body.
   * @param res - Response used to set auth cookies.
   * @param req - Request used to capture user-agent and IP metadata.
   * @returns The authenticated development user document.
   * @example
   * ```ts
   * await controller.devLogin({ email: 'dev@example.com', password: 'local-only' }, response, request);
   * ```
   */
  @Public()
  @Post('dev-login')
  @HttpCode(HttpStatus.OK)
  devLogin(
    @Body(new ZodValidationPipe(devLoginBodySchema)) body: DevLoginBody,
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
  ) {
    return this.authService.devLogin(body, res, req.headers['user-agent'], req.ip);
  }

  /**
   * Revokes the current refresh token and clears auth cookies.
   *
   * @param user - Current authenticated user.
   * @param req - Request containing the refresh token cookie.
   * @param res - Response used to clear auth cookies.
   * @returns Resolves when logout has completed.
   * @example
   * ```ts
   * await controller.logout(user, request, response);
   * ```
   */
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@CurrentUser() user: AuthAccountDocument, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return this.authService.logout(String(user._id), req.cookies?.['refresh_token'], res);
  }

  /**
   * Rotates the refresh token cookie and returns the associated user.
   *
   * @param req - Request containing the refresh token cookie.
   * @param res - Response used to set replacement auth cookies.
   * @returns A no-token message or the refreshed user document.
   * @throws UnauthorizedException Propagated when refresh token validation fails.
   * @example
   * ```ts
   * const result = await controller.refresh(request, response);
   * ```
   */
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = req.cookies?.['refresh_token'];
    if (!token) return { message: 'No refresh token' };
    return this.authService.refresh(token, res, req.headers['user-agent'], req.ip);
  }

  /**
   * Returns the current authenticated user's profile.
   *
   * @param user - Current authenticated user.
   * @returns The current user's persisted profile.
   * @example
   * ```ts
   * const me = await controller.getMe(user);
   * ```
   */
  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@CurrentUser() user: AuthAccountDocument) {
    return this.authService.getMe(String(user._id));
  }

  /**
   * Starts Google OAuth by delegating to Passport.
   *
   * @returns Nothing because Passport writes the redirect response.
   * @example
   * ```ts
   * controller.googleAuth();
   * ```
   */
  @Public()
  @UseGuards(GoogleAuthGuard)
  @Get('google')
  googleAuth() {
    // Passport handles redirect
  }

  /**
   * Completes Google OAuth and redirects to the configured post-login route.
   *
   * @param user - OAuth-authenticated user supplied by the Google strategy.
   * @param req - Request used to capture user-agent and IP metadata.
   * @param res - Response used to set cookies and redirect.
   * @returns Resolves after the auth service redirects.
   * @example
   * ```ts
   * await controller.googleCallback(user, request, response);
   * ```
   */
  @Public()
  @UseGuards(GoogleAuthGuard)
  @Get('google/callback')
  googleCallback(@CurrentUser() user: AuthAccountDocument, @Req() req: Request, @Res() res: Response) {
    const state = String(req.query['state'] ?? '') || undefined;
    return this.authService.oauthCallback(user, res, req.headers['user-agent'], req.ip, state);
  }

  /**
   * Starts GitHub OAuth by delegating to Passport.
   *
   * @returns Nothing because Passport writes the redirect response.
   * @example
   * ```ts
   * controller.githubAuth();
   * ```
   */
  @Public()
  @UseGuards(GithubAuthGuard)
  @Get('github')
  githubAuth() {
    // Passport handles redirect
  }

  /**
   * Completes GitHub OAuth and redirects to the configured post-login route.
   *
   * @param user - OAuth-authenticated user supplied by the GitHub strategy.
   * @param req - Request used to capture user-agent and IP metadata.
   * @param res - Response used to set cookies and redirect.
   * @returns Resolves after the auth service redirects.
   * @example
   * ```ts
   * await controller.githubCallback(user, request, response);
   * ```
   */
  @Public()
  @UseGuards(GithubAuthGuard)
  @Get('github/callback')
  githubCallback(@CurrentUser() user: AuthAccountDocument, @Req() req: Request, @Res() res: Response) {
    const state = String(req.query['state'] ?? '') || undefined;
    return this.authService.oauthCallback(user, res, req.headers['user-agent'], req.ip, state);
  }

  /**
   * Requests a password reset token for an email address.
   *
   * @param body - Body containing the email address to reset.
   * @returns Resolves without revealing whether the account exists.
   * @example
   * ```ts
   * await controller.forgotPassword({ email: 'user@example.com' });
   * ```
   */
  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  forgotPassword(@Body(new ZodValidationPipe(forgotPasswordBodySchema)) body: ForgotPasswordBody) {
    return this.authService.forgotPassword(body.email);
  }

  /**
   * Completes a password reset with a raw reset token.
   *
   * @param body - Body containing the reset token and replacement password.
   * @returns Resolves after the password is replaced.
   * @throws BadRequestException Propagated when the reset token is invalid or expired.
   * @example
   * ```ts
   * await controller.resetPassword({ token: 'raw-reset-token', password: 'new-secret' });
   * ```
   */
  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  resetPassword(@Body(new ZodValidationPipe(resetPasswordBodySchema)) body: ResetPasswordBody) {
    return this.authService.resetPassword(body.token, body.password);
  }

  /**
   * Verifies the current user's email address with a submitted code.
   *
   * @param user - Current authenticated user.
   * @param body - Body containing the one-time verification code.
   * @returns Resolves after verification succeeds or is already complete.
   * @throws UnauthorizedException Propagated when the user is missing.
   * @throws BadRequestException Propagated when the code is invalid or expired.
   * @example
   * ```ts
   * await controller.verifyEmail(user, { otp: 'A1B2C3' });
   * ```
   */
  @UseGuards(JwtAuthGuard)
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  verifyEmail(
    @CurrentUser() user: AuthAccountDocument,
    @Body(new ZodValidationPipe(verifyEmailBodySchema)) body: VerifyEmailBody,
  ) {
    return this.authService.verifyEmail(String(user._id), body.otp);
  }

  /**
   * Issues a replacement verification code for the current user.
   *
   * @param user - Current authenticated user.
   * @returns Resolves after the replacement code is stored.
   * @example
   * ```ts
   * await controller.resendVerification(user);
   * ```
   */
  @UseGuards(JwtAuthGuard)
  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  resendVerification(@CurrentUser() user: AuthAccountDocument) {
    return this.authService.resendVerification(String(user._id));
  }
}
