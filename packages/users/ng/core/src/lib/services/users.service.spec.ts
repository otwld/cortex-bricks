import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { CreateUserRequest, UserAccountStatus, UserOAuthProvider } from '@otwld/ts-users';
import { provideUsers } from '../provide-users';
import { UsersService } from './users.service';

describe(UsersService.name, () => {
  let service: UsersService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideUsers({ apiUrl: '/api/users' })],
    });
    service = TestBed.inject(UsersService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lists users from the configured API base', () => {
    service.list().subscribe((response) => expect(response.users).toEqual([]));

    const req = http.expectOne('/api/users');
    expect(req.request.method).toBe('GET');
    req.flush({ users: [] });
  });

  it('creates invited users without a password field', () => {
    const dto: CreateUserRequest = {
      email: 'ada@example.com',
      displayName: 'Ada Lovelace',
      accountStatus: UserAccountStatus.Active,
      roles: [],
      permissions: [],
      sendInvitation: true,
    };

    service.create(dto).subscribe((response) => expect(response.invitationLink).toBe('/accept-invitation/raw-token'));

    const req = http.expectOne('/api/users');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(dto);
    expect(req.request.body).not.toHaveProperty('password');
    req.flush({
      user: { id: 'profile-1' },
      invitation: { link: '/accept-invitation/raw-token', expiresAt: '2026-05-14T00:00:00.000Z', deliveryStatus: 'not-requested' },
      invitationSent: false,
      invitationLink: '/accept-invitation/raw-token',
    });
  });

  it('accepts invitations with local credentials', () => {
    service.acceptCredentials('raw token', { username: 'ada', password: 'secret123' }).subscribe((response) => expect(response.accepted).toBe(true));

    const req = http.expectOne('/api/users/invitations/raw%20token/credentials');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ username: 'ada', password: 'secret123' });
    req.flush({ accepted: true, user: { id: 'profile-1' } });
  });

  it('completes OAuth invitation acceptance', () => {
    service.completeOAuth('raw-token').subscribe((response) => expect(response.accepted).toBe(true));

    const req = http.expectOne('/api/users/invitations/raw-token/oauth/complete');
    expect(req.request.method).toBe('POST');
    req.flush({ accepted: true, user: { id: 'profile-1' } });
  });

  it('completes OAuth invitation acceptance with state', () => {
    service.completeOAuthState('oauth-state').subscribe((response) => expect(response.accepted).toBe(true));

    const req = http.expectOne('/api/users/invitations/oauth/complete');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ state: 'oauth-state' });
    req.flush({ accepted: true, user: { id: 'profile-1' } });
  });

  it('starts OAuth invitation acceptance by navigating to the backend redirect endpoint', () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);

    service.startOAuth('raw token', UserOAuthProvider.Google);

    expect(open).toHaveBeenCalledWith('/api/users/invitations/raw%20token/oauth/google', '_self');
  });

  it('changes and resets passwords through users endpoints', () => {
    service.changePassword({ currentPassword: 'old', newPassword: 'new' }).subscribe((response) => expect(response.changed).toBe(true));
    service.requestPasswordReset({ email: 'ada@example.com' }).subscribe((response) => expect(response.requested).toBe(true));
    service.resetPassword({ token: 'reset-token', password: 'new' }).subscribe((response) => expect(response.reset).toBe(true));

    const changeReq = http.expectOne('/api/users/me/password');
    expect(changeReq.request.method).toBe('POST');
    changeReq.flush({ changed: true });

    const requestReq = http.expectOne('/api/users/password-reset/request');
    expect(requestReq.request.method).toBe('POST');
    requestReq.flush({ requested: true });

    const resetReq = http.expectOne('/api/users/password-reset/complete');
    expect(resetReq.request.method).toBe('POST');
    resetReq.flush({ reset: true });
  });
});
