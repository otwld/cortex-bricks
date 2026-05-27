import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideAi } from '../provide-ai';
import { AiUsageService } from '../services/ai-usage.service';
import { AiUsageCardComponent } from './ai-usage-card.component';

describe(AiUsageCardComponent.name, () => {
  let fixture: ComponentFixture<AiUsageCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AiUsageCardComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAi({ apiBaseUrl: '/api/ai' }),
        {
          provide: AiUsageService,
          useValue: {
            snapshot: vi.fn().mockResolvedValue({
              subject: { type: 'user', id: 'user-1', roles: ['member'] },
              maxPromptTokens: 8_000,
              buckets: [
                {
                  window: { unit: 'hour', size: 1 },
                  limitTokens: 20_000,
                  usedTokens: 5_000,
                  reservedTokens: 0,
                  remainingTokens: 15_000,
                  resetAt: '2026-05-08T08:00:00.000Z',
                  exceeded: false,
                },
              ],
            }),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AiUsageCardComponent);
  });

  it('renders quota usage buckets', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('AI Usage');
    expect(fixture.nativeElement.textContent).toContain('5,000');
    expect(fixture.nativeElement.textContent).toContain('15,000');
    expect(fixture.nativeElement.textContent).toContain('Prompt limit');
  });
});
