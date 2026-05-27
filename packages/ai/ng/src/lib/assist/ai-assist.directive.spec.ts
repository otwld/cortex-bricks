import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { AiCompletionService } from '../services/ai-completion.service';
import { AiAssistDirective } from './ai-assist.directive';
import {
  AiAssistAcceptedEvent,
  AiAssistApplyMode,
  AiAssistErrorEvent,
  AiAssistGeneratedEvent,
  AiAssistPrompt,
} from './ai-assist.types';

type AssistDirectiveTestApi = {
  acceptSuggestion(): void;
  runPrompt(): Promise<void>;
};

class FakeCompletion {
  completion = '';
  error: Error | undefined;
  readonly complete = vi.fn(async () => {
    if (nextError) throw nextError;
    this.completion = nextText;
    return nextText;
  });
  readonly stop = vi.fn();
}

@Component({
  imports: [AiAssistDirective, FormsModule],
  template: `
    <textarea
      [aiAssist]="prompt"
      [aiAssistApplyMode]="applyMode"
      [(ngModel)]="value"
      (aiAssistAccepted)="accepted = $event"
      (aiAssistError)="failed = $event"
      (aiAssistGenerated)="generated = $event"
    ></textarea>
  `,
})
class Host {
  value = 'Original text';
  applyMode: AiAssistApplyMode = 'replace';
  prompt: AiAssistPrompt = ({ value }) => ({ prompt: `Rewrite: ${value}`, model: 'fast' });
  accepted: AiAssistAcceptedEvent | null = null;
  failed: AiAssistErrorEvent | null = null;
  generated: AiAssistGeneratedEvent | null = null;
}

let completions: FakeCompletion[];
let nextError: Error | null;
let nextText: string;

describe(AiAssistDirective.name, () => {
  let fixture: ComponentFixture<Host>;
  let completionService: Pick<AiCompletionService, 'createCompletion'>;

  beforeEach(async () => {
    completions = [];
    nextError = null;
    nextText = 'Generated copy';
    completionService = {
      createCompletion: vi.fn(() => {
        const completion = new FakeCompletion();
        completions.push(completion);
        return completion as unknown as ReturnType<AiCompletionService['createCompletion']>;
      }),
    };

    await TestBed.configureTestingModule({
      imports: [Host],
      providers: [{ provide: AiCompletionService, useValue: completionService }],
    }).compileComponents();

    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
    document.querySelectorAll('ai-assist-overlay').forEach((element) => element.remove());
  });

  it('runs the prompt with field context and applies the generated value through Angular forms', async () => {
    const assist = getAssist(fixture);

    await assist.runPrompt();
    assist.acceptSuggestion();
    fixture.detectChanges();
    await fixture.whenStable();

    const textarea = getTextArea(fixture);
    expect(completionService.createCompletion).toHaveBeenCalledWith({ model: 'fast' });
    expect(completions[0].complete).toHaveBeenCalledWith('Rewrite: Original text');
    expect(textarea.value).toBe('Generated copy');
    expect(fixture.componentInstance.value).toBe('Generated copy');
    expect(fixture.componentInstance.generated?.text).toBe('Generated copy');
    expect(fixture.componentInstance.accepted).toEqual(
      expect.objectContaining({
        previousValue: 'Original text',
        text: 'Generated copy',
        value: 'Generated copy',
      }),
    );
  });

  it('can replace the current selection instead of the whole value', async () => {
    fixture.componentInstance.applyMode = 'selection';
    fixture.componentInstance.prompt = ({ selectedText }) => `Replace: ${selectedText}`;
    fixture.detectChanges();
    nextText = 'Better';

    const textarea = getTextArea(fixture);
    textarea.focus();
    textarea.setSelectionRange(0, 'Original'.length);

    const assist = getAssist(fixture);
    await assist.runPrompt();
    assist.acceptSuggestion();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(completions[0].complete).toHaveBeenCalledWith('Replace: Original');
    expect(fixture.componentInstance.value).toBe('Better text');
  });

  it('emits completion failures without changing the attached control value', async () => {
    nextError = new Error('Provider unavailable');
    const assist = getAssist(fixture);

    await assist.runPrompt();

    expect(fixture.componentInstance.failed).toEqual(
      expect.objectContaining({
        message: 'Provider unavailable',
        request: expect.objectContaining({ prompt: 'Rewrite: Original text' }),
      }),
    );
    expect(fixture.componentInstance.value).toBe('Original text');
  });
});

function getAssist(fixture: ComponentFixture<Host>): AssistDirectiveTestApi {
  return fixture.debugElement.query(By.directive(AiAssistDirective)).injector.get(AiAssistDirective) as unknown as AssistDirectiveTestApi;
}

function getTextArea(fixture: ComponentFixture<Host>): HTMLTextAreaElement {
  return fixture.debugElement.query(By.css('textarea')).nativeElement as HTMLTextAreaElement;
}
