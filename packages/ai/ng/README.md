# @otwld/ng-ai

Angular services for AI chat, completion, structured object generation, model listing, and tool metadata.

```ts
import { provideAi } from '@otwld/ng-ai';

provideAi({ apiBaseUrl: '/api/ai' });
```

`AiChatService` sends Vercel AI `UIMessage` parts as-is, so text, files, tool parts, and metadata can round-trip through `nest-ai`. `AiCompletionService.complete()` rejects with `AiClientError` when the completion stream records an HTTP or stream error.

## Form assist directive

Import `AiAssistDirective` in any standalone component that already uses `provideAi`. Attach `aiAssist` to an input, textarea, or editable element to show a small PrimeNG floating AI control. Hovering the control runs the prompt, then the user can validate, retry, or cancel the generated value.

```ts
import { AiAssistDirective } from '@otwld/ng-ai';

@Component({
  imports: [AiAssistDirective],
  template: `
    <textarea
      [aiAssist]="({ value }) => ({
        prompt: 'Improve this product description. Return only the replacement text.\\n\\n' + value,
        model: 'fast',
      })"
      aiAssistApplyMode="replace"
    ></textarea>
  `,
})
export class ProductForm {}
```

## Usage card

`AiUsageCardComponent` displays the current user's quota windows from `GET /usage`.

```ts
import { AiUsageCardComponent } from '@otwld/ng-ai';

@Component({
  imports: [AiUsageCardComponent],
  template: `<ai-usage-card />`,
})
export class AiPage {}
```
