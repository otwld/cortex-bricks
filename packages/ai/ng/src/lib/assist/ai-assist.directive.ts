import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  ApplicationRef,
  ComponentRef,
  Directive,
  ElementRef,
  EnvironmentInjector,
  OnDestroy,
  PLATFORM_ID,
  booleanAttribute,
  createComponent,
  effect,
  inject,
  input,
  numberAttribute,
  output,
} from '@angular/core';
import { AiCompletionRequest } from '@otwld/ts-ai';
import { AiCompletionService, AiCompletionSession } from '../services/ai-completion.service';
import { AiAssistOverlay } from './ai-assist-overlay.component';
import {
  AiAssistAcceptedEvent,
  AiAssistApplyMode,
  AiAssistCanceledEvent,
  AiAssistContext,
  AiAssistErrorEvent,
  AiAssistGeneratedEvent,
  AiAssistPrompt,
  AiAssistPromptResult,
} from './ai-assist.types';

interface OutputSubscription {
  unsubscribe(): void;
}

/** Adds a floating AI assist trigger to editable host elements. */
@Directive({
  selector: '[aiAssist]',
})
export class AiAssistDirective implements AfterViewInit, OnDestroy {
  private readonly appRef = inject(ApplicationRef);
  private readonly completionService = inject(AiCompletionService);
  private readonly document = inject(DOCUMENT);
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly environmentInjector = inject(EnvironmentInjector);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  /** Prompt configuration used when the assist action runs. */
  readonly aiAssist = input<AiAssistPrompt | undefined>(undefined);

  /** How generated text should be applied to the host control. */
  readonly aiAssistApplyMode = input<AiAssistApplyMode>('replace');

  /** Disables assist interactions for the host control. */
  readonly aiAssistDisabled = input(false, { transform: booleanAttribute });

  /** Accessible label passed to the floating assist trigger. */
  readonly aiAssistLabel = input('Run AI assist');

  /** Optional maximum output token limit for the completion request. */
  readonly aiAssistMaxOutputTokens = input<number | undefined, unknown>(undefined, { transform: optionalNumberAttribute });

  /** Optional metadata sent with the completion request. */
  readonly aiAssistMetadata = input<Record<string, unknown> | undefined>(undefined);

  /** Optional model override for the completion request. */
  readonly aiAssistModel = input<string | undefined>(undefined);

  /** Optional system prompt sent with the completion request. */
  readonly aiAssistSystem = input<string | undefined>(undefined);

  /** Optional temperature override for the completion request. */
  readonly aiAssistTemperature = input<number | undefined, unknown>(undefined, { transform: optionalNumberAttribute });

  /** Emitted after a generated suggestion is applied. */
  readonly aiAssistAccepted = output<AiAssistAcceptedEvent>();

  /** Emitted when the assist session is cancelled. */
  readonly aiAssistCanceled = output<AiAssistCanceledEvent>();

  /** Emitted when completion generation fails. */
  readonly aiAssistError = output<AiAssistErrorEvent>();

  /** Emitted when a suggestion finishes generating. */
  readonly aiAssistGenerated = output<AiAssistGeneratedEvent>();

  private activeCompletion: AiCompletionSession | null = null;
  private componentRef: ComponentRef<AiAssistOverlay> | null = null;
  private generationId = 0;
  private lastGenerated: AiAssistGeneratedEvent | null = null;
  private readonly cleanupCallbacks: Array<() => void> = [];
  private readonly outputSubscriptions: OutputSubscription[] = [];

  constructor() {
    effect(() => {
      const disabled = this.aiAssistDisabled();
      const label = this.aiAssistLabel();
      this.componentRef?.setInput('disabled', disabled);
      this.componentRef?.setInput('label', label);
      this.updateOverlayPosition();
    });
  }

  /** Creates the overlay once browser DOM APIs are available. */
  ngAfterViewInit(): void {
    if (!this.isBrowser) return;

    this.createOverlay();
    this.bindPositionListeners();
    this.updateOverlayPosition();
  }

  /** Aborts in-flight generation and removes overlay DOM resources. */
  ngOnDestroy(): void {
    this.generationId += 1;
    this.abortActiveCompletion();

    while (this.cleanupCallbacks.length) {
      this.cleanupCallbacks.pop()?.();
    }

    while (this.outputSubscriptions.length) {
      this.outputSubscriptions.pop()?.unsubscribe();
    }

    if (this.componentRef) {
      const hostElement = this.componentRef.location.nativeElement;
      this.appRef.detachView(this.componentRef.hostView);
      this.componentRef.destroy();
      hostElement.remove();
      this.componentRef = null;
    }
  }

  private createOverlay(): void {
    const hostElement = this.document.createElement('ai-assist-overlay');
    this.document.body.appendChild(hostElement);

    const componentRef = createComponent(AiAssistOverlay, {
      environmentInjector: this.environmentInjector,
      hostElement,
    });
    this.appRef.attachView(componentRef.hostView);
    this.componentRef = componentRef;

    componentRef.setInput('disabled', this.aiAssistDisabled());
    componentRef.setInput('label', this.aiAssistLabel());

    this.outputSubscriptions.push(
      componentRef.instance.runRequested.subscribe(() => void this.runPrompt()),
      componentRef.instance.retryRequested.subscribe(() => void this.retryPrompt()),
      componentRef.instance.acceptRequested.subscribe(() => this.acceptSuggestion()),
      componentRef.instance.cancelRequested.subscribe(() => this.cancelSuggestion()),
    );
  }

  private bindPositionListeners(): void {
    const host = this.elementRef.nativeElement;
    const view = this.document.defaultView;
    const update = () => this.updateOverlayPosition();

    this.listen(host, 'focus', update, true);
    this.listen(host, 'input', update);
    this.listen(host, 'mouseenter', update);
    this.listen(host, 'keyup', update);

    if (view) {
      this.listen(view, 'resize', update);
      this.listen(view, 'scroll', update, true);

      if ('ResizeObserver' in view) {
        const observer = new view.ResizeObserver(update);
        observer.observe(host);
        this.cleanupCallbacks.push(() => observer.disconnect());
      }
    }
  }

  private listen(target: EventTarget, type: string, listener: EventListener, options?: AddEventListenerOptions | boolean): void {
    target.addEventListener(type, listener, options);
    this.cleanupCallbacks.push(() => target.removeEventListener(type, listener, options));
  }

  private updateOverlayPosition(): void {
    const component = this.componentRef?.instance;
    const view = this.document.defaultView;
    if (!component || !view) return;

    const host = this.elementRef.nativeElement;
    const rect = host.getBoundingClientRect();
    const buttonSize = 32;
    const viewportPadding = 8;
    const hostVisible =
      !this.aiAssistDisabled() &&
      host.isConnected &&
      rect.width > 0 &&
      rect.height > 0 &&
      rect.bottom >= 0 &&
      rect.top <= view.innerHeight &&
      rect.right >= 0 &&
      rect.left <= view.innerWidth;

    if (!hostVisible) {
      component.setPosition(0, 0, false);
      return;
    }

    const left = clamp(rect.right - buttonSize - 6, viewportPadding, view.innerWidth - buttonSize - viewportPadding);
    const verticalOffset = Math.min(8, Math.max(0, (rect.height - buttonSize) / 2));
    const top = clamp(rect.top + verticalOffset, viewportPadding, view.innerHeight - buttonSize - viewportPadding);
    component.setPosition(left, top, true);
  }

  private async retryPrompt(): Promise<void> {
    this.generationId += 1;
    this.abortActiveCompletion();
    await this.runPrompt();
  }

  /** Run the configured prompt for the current host element value. */
  public async runPrompt(): Promise<void> {
    if (this.aiAssistDisabled()) return;

    const component = this.componentRef?.instance;
    if (!component || component.status() === 'loading') return;

    const generationId = this.generationId + 1;
    this.generationId = generationId;
    this.lastGenerated = null;
    this.abortActiveCompletion();
    component.setLoading();

    const context = this.createContext();
    let request: AiCompletionRequest | null = null;

    try {
      request = await this.buildRequest(context);
      if (generationId !== this.generationId) return;

      const completion = this.completionService.createCompletion(this.requestOptions(request));
      this.activeCompletion = completion;
      const view = this.document.defaultView;
      if (!view) throw new Error('AI assist requires a browser window');

      const syncInterval = view.setInterval(() => component.setStreamingText(completion.completion), 50);

      try {
        const result = await completion.complete(request.prompt);
        view.clearInterval(syncInterval);
        component.setStreamingText(completion.completion);

        if (completion.error) throw completion.error;
        if (generationId !== this.generationId) return;

        const text = result ?? completion.completion;
        const generated: AiAssistGeneratedEvent = { context, request, text };
        this.lastGenerated = generated;
        component.setGenerated(text);
        this.aiAssistGenerated.emit(generated);
      } finally {
        view.clearInterval(syncInterval);
      }
    } catch (error) {
      if (generationId !== this.generationId) return;

      const message = this.errorMessage(error);
      component.setError(message);
      this.aiAssistError.emit({ context, error, message, request });
    } finally {
      if (generationId === this.generationId) this.activeCompletion = null;
    }
  }

  private cancelSuggestion(): void {
    const context = this.createContext();
    const component = this.componentRef?.instance;
    const generatedText = component?.suggestion() || null;

    this.generationId += 1;
    this.abortActiveCompletion();
    this.lastGenerated = null;
    component?.reset();
    component?.hide();
    this.aiAssistCanceled.emit({ context, generatedText });
  }

  /** Accept the latest generated suggestion and apply it to the host control. */
  public acceptSuggestion(): void {
    const generated = this.lastGenerated;
    const component = this.componentRef?.instance;
    if (!generated || !component || component.status() !== 'generated') return;

    const context = this.createContext();
    const previousValue = context.value;
    const value = this.writeValue(generated.text, context);

    this.aiAssistAccepted.emit({
      ...generated,
      context,
      previousValue,
      value,
    });

    this.lastGenerated = null;
    component.reset();
    component.hide();
  }

  private abortActiveCompletion(): void {
    this.activeCompletion?.stop();
    this.activeCompletion = null;
  }

  private async buildRequest(context: AiAssistContext): Promise<AiCompletionRequest> {
    const promptInput = this.aiAssist();
    const inputModel = this.aiAssistModel();
    const inputSystem = this.aiAssistSystem();
    const inputTemperature = this.aiAssistTemperature();
    const inputMaxOutputTokens = this.aiAssistMaxOutputTokens();
    const inputMetadata = this.aiAssistMetadata();
    const resolved = await this.resolvePrompt(promptInput, context);
    const partial = typeof resolved === 'string' ? { prompt: resolved } : (resolved ?? {});
    const prompt = partial.prompt?.trim() ? partial.prompt : this.defaultPrompt(context);

    return removeUndefined({
      ...partial,
      prompt,
      maxOutputTokens: inputMaxOutputTokens ?? partial.maxOutputTokens,
      metadata: mergeMetadata(partial.metadata, inputMetadata),
      model: inputModel ?? partial.model,
      system: inputSystem ?? partial.system,
      temperature: inputTemperature ?? partial.temperature,
    }) as AiCompletionRequest;
  }

  private async resolvePrompt(prompt: AiAssistPrompt | undefined, context: AiAssistContext): Promise<AiAssistPromptResult | undefined> {
    if (typeof prompt === 'function') return prompt(context);
    return prompt;
  }

  private defaultPrompt(context: AiAssistContext): string {
    const selectedText = context.selectedText.trim();
    const value = selectedText || context.value.trim();
    const target = selectedText ? 'selected text' : 'form field value';

    if (!value) {
      return 'Draft a concise value for this form field. Return only the field value, without quotes or markdown.';
    }

    return `Improve the ${target}. Return only the replacement text, without quotes or markdown.\n\n${value}`;
  }

  private requestOptions(request: AiCompletionRequest): Partial<Omit<AiCompletionRequest, 'prompt'>> {
    return removeUndefined({
      maxOutputTokens: request.maxOutputTokens,
      metadata: request.metadata,
      model: request.model,
      system: request.system,
      temperature: request.temperature,
    });
  }

  private createContext(): AiAssistContext {
    const element = this.elementRef.nativeElement;
    const value = this.readValue(element);
    const selection = this.readSelection(element);

    return {
      element,
      value,
      selectedText:
        selection.start === null || selection.end === null || selection.start === selection.end ? '' : value.slice(selection.start, selection.end),
      selectionEnd: selection.end,
      selectionStart: selection.start,
    };
  }

  private readValue(element: HTMLElement): string {
    if (this.isInputElement(element) || this.isTextAreaElement(element)) return element.value;
    if (element.isContentEditable) return element.textContent ?? '';

    const elementWithValue = element as HTMLElement & { value?: unknown };
    if ('value' in elementWithValue) return String(elementWithValue.value ?? '');

    return element.textContent ?? '';
  }

  private writeValue(generatedText: string, context: AiAssistContext): string {
    const element = this.elementRef.nativeElement;
    const mode = this.aiAssistApplyMode();
    const previousValue = context.value;
    let value = generatedText;
    let caretPosition: number | null = null;

    if (mode === 'append') {
      const separator = previousValue ? this.appendSeparator(previousValue, element) : '';
      value = `${previousValue}${separator}${generatedText}`;
      caretPosition = value.length;
    } else if (mode === 'selection' && context.selectionStart !== null && context.selectionEnd !== null) {
      value = `${previousValue.slice(0, context.selectionStart)}${generatedText}${previousValue.slice(context.selectionEnd)}`;
      caretPosition = context.selectionStart + generatedText.length;
    }

    this.setElementValue(element, value, caretPosition);
    return value;
  }

  private setElementValue(element: HTMLElement, value: string, caretPosition: number | null): void {
    if (this.isInputElement(element) || this.isTextAreaElement(element)) {
      element.value = value;
      this.setSelectionRange(element, caretPosition);
    } else if (element.isContentEditable) {
      element.textContent = value;
    } else {
      const elementWithValue = element as HTMLElement & { value?: string };
      if ('value' in elementWithValue) elementWithValue.value = value;
      else element.textContent = value;
    }

    element.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
  }

  private appendSeparator(value: string, element: HTMLElement): string {
    if (/\s$/.test(value)) return '';
    return this.isTextAreaElement(element) || element.isContentEditable ? '\n' : ' ';
  }

  private readSelection(element: HTMLElement): { start: number | null; end: number | null } {
    if (!this.isInputElement(element) && !this.isTextAreaElement(element)) return { start: null, end: null };

    try {
      return {
        end: element.selectionEnd,
        start: element.selectionStart,
      };
    } catch {
      return { start: null, end: null };
    }
  }

  private setSelectionRange(element: HTMLInputElement | HTMLTextAreaElement, caretPosition: number | null): void {
    if (caretPosition === null) return;

    try {
      element.setSelectionRange(caretPosition, caretPosition);
    } catch {
      return;
    }
  }

  private isInputElement(element: HTMLElement): element is HTMLInputElement {
    const view = element.ownerDocument.defaultView;
    return !!view && element instanceof view.HTMLInputElement;
  }

  private isTextAreaElement(element: HTMLElement): element is HTMLTextAreaElement {
    const view = element.ownerDocument.defaultView;
    return !!view && element instanceof view.HTMLTextAreaElement;
  }

  private errorMessage(error: unknown): string {
    if (error instanceof Error && error.message.trim()) return error.message;
    if (typeof error === 'string' && error.trim()) return error;
    return 'AI assist failed';
  }
}

function optionalNumberAttribute(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;

  const parsed = numberAttribute(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function removeUndefined<T extends Record<string, unknown>>(value: T): Partial<T> {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined)) as Partial<T>;
}

function mergeMetadata(
  requestMetadata: Record<string, unknown> | undefined,
  inputMetadata: Record<string, unknown> | undefined,
): Record<string, unknown> | undefined {
  if (!requestMetadata && !inputMetadata) return undefined;
  return {
    ...(requestMetadata ?? {}),
    ...(inputMetadata ?? {}),
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
