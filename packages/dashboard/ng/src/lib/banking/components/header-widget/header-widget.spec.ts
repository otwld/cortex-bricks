import { TestBed } from '@angular/core/testing';

import { BankingHeaderAction, BankingHeaderActionEvent, HeaderWidget } from './header-widget';

describe(HeaderWidget.name, () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeaderWidget],
    }).compileComponents();
  });

  it('renders the default profile and actions', () => {
    const fixture = TestBed.createComponent(HeaderWidget);

    fixture.detectChanges();

    const element: HTMLElement = fixture.nativeElement;
    expect(element.textContent).toContain('Welcome Isabel');
    expect(element.textContent).toContain('Your last login was on 04/05/2022 at 10:24 am');
  });

  it('builds a profile view model from input data', () => {
    const fixture = TestBed.createComponent(HeaderWidget);

    fixture.componentRef.setInput('profile', {
      name: 'Maya',
      avatarUrl: '/avatar.png',
      lastLoginLabel: 'Last login today',
    });
    fixture.detectChanges();

    const viewModel = fixture.componentInstance.profileViewModel();

    expect(viewModel.title).toBe('Welcome Maya');
    expect(viewModel.avatarAlt).toBe('Maya avatar');
    expect(fixture.nativeElement.textContent).toContain('Last login today');
  });

  it('emits typed action events', () => {
    const fixture = TestBed.createComponent(HeaderWidget);
    const action: BankingHeaderAction = { id: 'send', label: 'Send', icon: 'pi pi-send' };
    const selections: BankingHeaderActionEvent[] = [];
    const events: unknown[] = [];

    fixture.componentInstance.actionSelected.subscribe((event) => selections.push(event));
    fixture.componentInstance.events$.subscribe((event) => events.push(event));
    fixture.detectChanges();

    fixture.componentInstance.selectAction(action);

    expect(selections).toEqual([{ action }]);
    expect(events).toEqual([{ type: 'action', action }]);
  });
});
