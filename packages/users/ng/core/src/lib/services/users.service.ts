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

  /** Lists users. */
  /**
   * Runs list.
   *
   * @returns The users service list result.
   */
  list(): Observable<ListUsersResponse> {
    return this.http.get<ListUsersResponse>(this.base);
  }

  /** Loads a user by id. */
  /**
   * Runs get.
   *
   * @param id - id value.
   *
   * @returns The users service get result.
   */
  get(id: string): Observable<UserProfileResponse> {
    return this.http.get<UserProfileResponse>(`${this.base}/${encodeURIComponent(id)}`);
  }

  /** Creates an invited user. */
  /**
   * Runs create.
   *
   * @param dto - dto value.
   *
   * @returns The users service create result.
   */
  create(dto: CreateUserRequest): Observable<UserProfileResponse> {
    return this.http.post<UserProfileResponse>(this.base, dto);
  }

  /** Updates a user. */
  /**
   * Runs update.
   *
   * @param id - id value.
   *
   * @param dto - dto value.
   *
   * @returns The users service update result.
   */
  update(id: string, dto: UpdateUserRequest): Observable<UserProfileResponse> {
    return this.http.patch<UserProfileResponse>(`${this.base}/${encodeURIComponent(id)}`, dto);
  }

  /** Soft deletes a user. */
  /**
   * Runs delete.
   *
   * @param id - id value.
   *
   * @returns The users service delete result.
   */
  delete(id: string): Observable<UserProfileResponse> {
    return this.http.delete<UserProfileResponse>(`${this.base}/${encodeURIComponent(id)}`);
  }

  /** Resends a user invitation. */
  /**
   * Runs resend invitation.
   *
   * @param id - id value.
   *
   * @returns The users service resend invitation result.
   */
  resendInvitation(id: string): Observable<UserProfileResponse> {
    return this.http.post<UserProfileResponse>(`${this.base}/${encodeURIComponent(id)}/resend-invitation`, {});
  }

  /** Loads invitation details. */
  /**
   * Runs get invitation.
   *
   * @param token - token value.
   *
   * @returns The users service get invitation result.
   */
  getInvitation(token: string): Observable<UserInvitationResponse> {
    return this.http.get<UserInvitationResponse>(`${this.base}/invitations/${encodeURIComponent(token)}`);
  }

  /** Accepts an invitation with local credentials. */
  /**
   * Runs accept credentials.
   *
   * @param token - token value.
   *
   * @param dto - dto value.
   *
   * @returns The users service accept credentials result.
   */
  acceptCredentials(token: string, dto: AcceptInvitationCredentialsRequest): Observable<AcceptInvitationResponse> {
    return this.http.post<AcceptInvitationResponse>(`${this.base}/invitations/${encodeURIComponent(token)}/credentials`, dto);
  }

  /** Starts social invitation acceptance in the current browser tab. */
  /**
   * Runs start oauth.
   *
   * @param token - token value.
   *
   * @param provider - provider value.
   */
  startOAuth(token: string, provider: UserOAuthProvider): void {
    window.open(`${this.base}/invitations/${encodeURIComponent(token)}/oauth/${provider}`, '_self');
  }

  /** Completes social invitation acceptance after OAuth login. */
  /**
   * Runs complete oauth.
   *
   * @param token - token value.
   *
   * @returns The users service complete oauth result.
   */
  completeOAuth(token: string): Observable<AcceptInvitationResponse> {
    return this.http.post<AcceptInvitationResponse>(`${this.base}/invitations/${encodeURIComponent(token)}/oauth/complete`, {});
  }

  /** Completes social invitation acceptance with a single-use OAuth state. */
  /**
   * Runs complete oauth state.
   *
   * @param state - state value.
   *
   * @returns The users service complete oauth state result.
   */
  completeOAuthState(state: string): Observable<AcceptInvitationResponse> {
    const body: CompleteInvitationOAuthRequest = { state };
    return this.http.post<AcceptInvitationResponse>(`${this.base}/invitations/oauth/complete`, body);
  }

  /** Changes the current user's password. */
  /**
   * Runs change password.
   *
   * @param dto - dto value.
   *
   * @returns The users service change password result.
   */
  changePassword(dto: ChangeUserPasswordRequest): Observable<PasswordFlowResponse> {
    return this.http.post<PasswordFlowResponse>(`${this.base}/me/password`, dto);
  }

  /** Requests a password reset. */
  /**
   * Runs request password reset.
   *
   * @param dto - dto value.
   *
   * @returns The users service request password reset result.
   */
  requestPasswordReset(dto: RequestUserPasswordResetRequest): Observable<PasswordFlowResponse> {
    return this.http.post<PasswordFlowResponse>(`${this.base}/password-reset/request`, dto);
  }

  /** Completes a password reset. */
  /**
   * Runs reset password.
   *
   * @param dto - dto value.
   *
   * @returns The users service reset password result.
   */
  resetPassword(dto: ResetUserPasswordRequest): Observable<PasswordFlowResponse> {
    return this.http.post<PasswordFlowResponse>(`${this.base}/password-reset/complete`, dto);
  }
}
