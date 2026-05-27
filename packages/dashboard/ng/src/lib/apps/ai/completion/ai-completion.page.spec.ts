import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AiCompletionService, AiModelsService, AiUsageService } from '@otwld/ng-ai';
import { AiCompletionPage } from './ai-completion.page';

describe(AiCompletionPage.name, () => {
  let fixture: ComponentFixture<AiCompletionPage>;
  let completion: Pick<AiCompletionService, 'abort' | 'complete' | 'error' | 'loading' | 'text'>;

  beforeEach(async () => {
    completion = {
      abort: vi.fn(),
      complete: vi.fn().mockResolvedValue('Generated text'),
      text: signal('Generated text'),
      loading: signal(false),
      error: signal(null),
    };

    await TestBed.configureTestingModule({
      imports: [AiCompletionPage],
      providers: [
        { provide: AiCompletionService, useValue: completion },
        {
          provide: AiModelsService,
          useValue: {
            list: () => Promise.resolve([{ alias: 'fast', providerModel: 'openai:gpt-5.4-mini', capabilities: ['completion'] }]),
          },
        },
        {
          provide: AiUsageService,
          useValue: {
            snapshot: () => Promise.resolve({ subject: { type: 'user', id: 'user-1', roles: [] }, buckets: [] }),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AiCompletionPage);
  });

  it('submits prompts through ng-ai', async () => {
    fixture.componentInstance.prompt.set('Write a changelog');

    await fixture.componentInstance.submit();

    expect(completion.complete).toHaveBeenCalledWith({ prompt: 'Write a changelog', model: 'fast' });
  });
});
