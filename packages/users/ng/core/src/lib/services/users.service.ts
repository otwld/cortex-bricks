import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import {
  AcceptInvitationCredentialsRequest,
  AcceptInvitationResponse,
  ChangeUserPasswordRequest,
  CompleteInvitationOAuthRequest,
  CreateUserRequest,
  ListUsersResponse,
  PasswordFlowResponse,
  RequestUserPasswordResetRequest,
  ResetUserPasswordRequest,
  UpdateUserRequest,
  UserInvitationResponse,
  UserOAuthProvider,
  UserProfileResponse,
} from '@otwld/ts-users';
import type { Observable } from 'rxjs';
import { USERS_CONFIG } from '../tokens/users-config.token';

/** Typed Angular client for /api/users endpoints. */
@Injectable({ providedIn: 'root' })
export class UsersService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(USERS_CONFIG);

  private get base(): string {
    return this.config.apiUrl.replace(/\/$/, '');
  }

  /** Lists users visible to the current users API context. */
  list(): Observable<ListUsersResponse> {
    return this.http.get<ListUsersResponse>(this.base);
  }

  /** Loads one user profile by id. */
  get(id: string): Observable<UserProfileResponse> {
    return this.http.get<UserProfileResponse>(`${this.base}/${encodeURIComponent(id)}`);
  }

  /** Creates an invited user from the wizard request payload. */
  create(dto: CreateUserRequest): Observable<UserProfileResponse> {
    return this.http.post<UserProfileResponse>(this.base, dto);
  }

  /** Updates one user profile by id. */
  update(id: string, dto: UpdateUserRequest): Observable<UserProfileResponse> {
    return this.http.patch<UserProfileResponse>(`${this.base}/${encodeURIComponent(id)}`, dto);
  }

  /** Soft deletes one user by id. */
  delete(id: string): Observable<UserProfileResponse> {
    return this.http.delete<UserProfileResponse>(`${this.base}/${encodeURIComponent(id)}`);
  }

  /** Resends an invitation for one user by id. */
  resendInvitation(id: string): Observable<UserProfileResponse> {
    return this.http.post<UserProfileResponse>(`${this.base}/${encodeURIComponent(id)}/resend-invitation`, {});
  }

  /** Loads invitation details for an invitation token. */
  getInvitation(token: string): Observable<UserInvitationResponse> {
    return this.http.get<UserInvitationResponse>(`${this.base}/invitations/${encodeURIComponent(token)}`);
  }

  /** Accepts an invitation by creating local username/password credentials. */
  acceptCredentials(token: string, dto: AcceptInvitationCredentialsRequest): Observable<AcceptInvitationResponse> {
    return this.http.post<AcceptInvitationResponse>(`${this.base}/invitations/${encodeURIComponent(token)}/credentials`, dto);
  }

  /** Starts social invitation acceptance in the current browser tab. */
  startOAuth(token: string, provider: UserOAuthProvider): void {
    window.open(`${this.base}/invitations/${encodeURIComponent(token)}/oauth/${provider}`, '_self');
  }

  /** Completes social invitation acceptance after OAuth login using an invitation token. */
  completeOAuth(token: string): Observable<AcceptInvitationResponse> {
    return this.http.post<AcceptInvitationResponse>(`${this.base}/invitations/${encodeURIComponent(token)}/oauth/complete`, {});
  }

  /** Completes social invitation acceptance with a single-use OAuth state. */
  completeOAuthState(state: string): Observable<AcceptInvitationResponse> {
    const body: CompleteInvitationOAuthRequest = { state };
    return this.http.post<AcceptInvitationResponse>(`${this.base}/invitations/oauth/complete`, body);
  }

  /** Changes the current user's password. */
  changePassword(dto: ChangeUserPasswordRequest): Observable<PasswordFlowResponse> {
    return this.http.post<PasswordFlowResponse>(`${this.base}/me/password`, dto);
  }

  /** Requests a password reset for the submitted account identifier. */
  requestPasswordReset(dto: RequestUserPasswordResetRequest): Observable<PasswordFlowResponse> {
    return this.http.post<PasswordFlowResponse>(`${this.base}/password-reset/request`, dto);
  }

  /** Completes a password reset using the supplied reset token and new password. */
  resetPassword(dto: ResetUserPasswordRequest): Observable<PasswordFlowResponse> {
    return this.http.post<PasswordFlowResponse>(`${this.base}/password-reset/complete`, dto);
  }
}
