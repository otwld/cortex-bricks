import { CreateUserRequest } from './create-user.request';

/** Request body accepted by PATCH /api/users/:id. */
export type UpdateUserRequest = Partial<Omit<CreateUserRequest, 'email' | 'sendInvitation'>> & {
  /** Email can be changed only when the backend validates uniqueness. */
  email?: string;
};
