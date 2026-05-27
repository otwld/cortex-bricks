import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AiAssistPromptFactory, AiCompletionService, AiModelsService } from '@otwld/ng-ai';
import { AiAssistPage } from './ai-assist.page';

describe(AiAssistPage.name, () => {
  let fixture: ComponentFixture<AiAssistPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AiAssistPage],
      providers: [
        {
          provide: AiModelsService,
          useValue: {
            list: () =>
              Promise.resolve([
                { alias: 'fast', providerModel: 'openai:gpt-5.4-mini', capabilities: ['completion'] },
                { alias: 'chat', providerModel: 'openai:gpt-5.4', capabilities: ['chat'] },
              ]),
          },
        },
        {
          provide: AiCompletionService,
          useValue: {
            createCompletion: vi.fn(),
            error: signal(null),
            loading: signal(false),
            text: signal(''),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AiAssistPage);
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
    document.querySelectorAll('ai-assist-overlay').forEach((element) => element.remove());
  });

  it('loads completion-capable model options', async () => {
    await fixture.whenStable();

    expect(fixture.componentInstance.selectedModel()).toBe('fast');
    expect(fixture.componentInstance.modelOptions()).toEqual([{ label: 'fast', value: 'fast' }]);
  });

  it('builds contextual support reply prompts', async () => {
    const promptFactory = fixture.componentInstance.supportReplyPrompt as AiAssistPromptFactory;
    const prompt = await promptFactory({
      element: document.createElement('textarea'),
      selectedText: '',
      selectionEnd: null,
      selectionStart: null,
      value: 'Draft reply',
    });

    expect(prompt).toEqual(
      expect.objectContaining({
        prompt: expect.stringContaining('Customer name: Maya Chen'),
        system: expect.stringContaining('B2B support replies'),
      }),
    );
  });
});
