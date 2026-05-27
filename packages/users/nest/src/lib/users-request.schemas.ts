import {
  UserAccountStatus,
  UserGender,
  UserOAuthProvider,
} from '@otwld/ts-users';
import { z } from 'zod';

const optionalString = z
  .string()
  .trim()
  .transform((value) => (value ? value : undefined))
  .optional();

const emailSchema = z
  .string()
  .trim()
  .email()
  .transform((value) => value.toLowerCase());

const roleSchema = z
  .object({
    name: z.string().trim().min(1),
    permissions: z.array(z.string().trim().min(1)),
  })
  .strict();

const commonProfileFields = {
  username: optionalString,
  firstName: optionalString,
  lastName: optionalString,
  bio: optionalString,
  avatar: optionalString,
  gender: z.nativeEnum(UserGender).optional(),
  phone: optionalString,
  department: optionalString,
  position: optionalString,
  employmentType: z.enum(['full-time', 'part-time', 'contractor', 'intern', 'temporary']).optional(),
  hybridWork: z.boolean().optional(),
  officeLocation: optionalString,
  country: optionalString,
  region: optionalString,
  city: optionalString,
  postalCode: optionalString,
  addressLine1: optionalString,
  addressLine2: optionalString,
  internalNotes: optionalString,
};

/** Runtime schema for POST /api/users. */
export const createUserRequestSchema = z
  .object({
    email: emailSchema,
    displayName: z.string().trim().min(1),
    accountStatus: z.nativeEnum(UserAccountStatus),
    roles: z.array(roleSchema),
    permissions: z.array(z.string().trim().min(1)),
    sendInvitation: z.boolean(),
    ...commonProfileFields,
  })
  .strict();

/** Runtime schema for PATCH /api/users/:id. */
export const updateUserRequestSchema = z
  .object({
    email: emailSchema.optional(),
    displayName: z.string().trim().min(1).optional(),
    accountStatus: z.nativeEnum(UserAccountStatus).optional(),
    roles: z.array(roleSchema).optional(),
    permissions: z.array(z.string().trim().min(1)).optional(),
    ...commonProfileFields,
  })
  .strict();

/** Runtime schema for invitation credential setup. */
export const acceptInvitationCredentialsRequestSchema = z
  .object({
    username: optionalString,
    password: z.string().min(8).max(256),
  })
  .strict();

/** Runtime schema for invitation OAuth completion. */
export const completeInvitationOAuthRequestSchema = z
  .object({
    state: z.string().min(1),
  })
  .strict();

/** Runtime schema for current-user password changes. */
export const changeUserPasswordRequestSchema = z
  .object({
    currentPassword: z.string().min(1).max(256),
    newPassword: z.string().min(8).max(256),
  })
  .strict();

/** Runtime schema for password reset requests. */
export const requestUserPasswordResetRequestSchema = z
  .object({
    email: emailSchema,
  })
  .strict();

/** Runtime schema for password reset completion. */
export const resetUserPasswordRequestSchema = z
  .object({
    token: z.string().min(1),
    password: z.string().min(8).max(256),
  })
  .strict();

/** Runtime schema for supported OAuth providers. */
export const userOAuthProviderSchema = z.nativeEnum(UserOAuthProvider);
