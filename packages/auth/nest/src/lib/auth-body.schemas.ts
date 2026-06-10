import { z } from 'zod';
import type { DevLoginDto, RegisterDto } from './auth.service';

const emailSchema = z
  .string()
  .trim()
  .email()
  .transform((value) => value.toLowerCase());

const optionalNameSchema = z.string().trim().min(1).max(120).optional();
const passwordSchema = z.string().min(8).max(256);

/** Runtime schema for POST /auth/register. */
export const registerBodySchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    firstName: optionalNameSchema,
    lastName: optionalNameSchema,
  })
  .strict();

/** Runtime schema for POST /auth/dev-login. */
export const devLoginBodySchema = z
  .object({
    email: emailSchema,
    password: z.string().min(1).max(256),
  })
  .strict();

/** Runtime schema for POST /auth/forgot-password. */
export const forgotPasswordBodySchema = z
  .object({
    email: emailSchema,
  })
  .strict();

/** Runtime schema for POST /auth/reset-password. */
export const resetPasswordBodySchema = z
  .object({
    token: z.string().trim().min(32).max(512),
    password: passwordSchema,
  })
  .strict();

/** Runtime schema for POST /auth/verify-email. */
export const verifyEmailBodySchema = z
  .object({
    otp: z.string().trim().regex(/^\d{6}$/),
  })
  .strict();

/**
 * Validated request body for credentials account registration.
 */
export type RegisterBody = RegisterDto;

/**
 * Validated request body for the development-only login endpoint.
 */
export type DevLoginBody = DevLoginDto;

/**
 * Validated request body for password-reset email requests.
 */
export type ForgotPasswordBody = z.infer<typeof forgotPasswordBodySchema>;

/**
 * Validated request body for setting a new password from a reset token.
 */
export type ResetPasswordBody = z.infer<typeof resetPasswordBodySchema>;

/**
 * Validated request body for six-digit email verification codes.
 */
export type VerifyEmailBody = z.infer<typeof verifyEmailBodySchema>;
