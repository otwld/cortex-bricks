import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { UsersService } from '@otwld/ng-users/core';
import { of } from 'rxjs';
import { OAuthCompletePage } from './oauth-complete';

describe(OAuthCompletePage.name, () => {
  let fixture: ComponentFixture<OAuthCompletePage>;
  const usersService = {
    completeOAuthState: vi.fn().mockReturnValue(of({ accepted: true, user: { id: 'profile-1' } })),
  };

  beforeEach(async () => {
    usersService.completeOAuthState.mockClear();

    await TestBed.configureTestingModule({
      imports: [OAuthCompletePage],
      providers: [
        { provide: UsersService, useValue: usersService },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: new Map([['state', 'oauth-state']]) } } },
        { provide: Router, useValue: { navigateByUrl: vi.fn() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OAuthCompletePage);
    fixture.detectChanges();
  });

  it('renders a completion state and completes the invitation', () => {
    expect(fixture.nativeElement.textContent).toContain('Completing invitation');
    expect(usersService.completeOAuthState).toHaveBeenCalledWith('oauth-state');
  });
});
