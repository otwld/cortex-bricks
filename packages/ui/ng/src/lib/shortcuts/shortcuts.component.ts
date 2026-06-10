import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { Shortcut } from '@otwld/ts-sdk';

@Component({
  selector: 'kit-shortcuts',
  standalone: true,
  template: `
    <div class="kit-shortcuts">
      @for (column of columns(); track $index) {
        <dl class="kit-shortcuts__column">
          @for (shortcut of column; track shortcut.key) {
            <div class="kit-shortcuts__row">
              <dt>{{ shortcut.labelI18n }}</dt>
              <dd>{{ shortcut.key }}</dd>
            </div>
          }
        </dl>
      }
    </div>
  `,
  styles: [
    `
      .kit-shortcuts {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
        gap: 1rem;
      }

      .kit-shortcuts__column {
        display: grid;
        gap: 0.5rem;
        margin: 0;
      }

      .kit-shortcuts__row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
      }

      dt,
      dd {
        margin: 0;
      }

      dd {
        border-radius: 0.375rem;
        background: #f1f5f9;
        padding: 0.25rem 0.5rem;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        font-size: 0.8125rem;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShortcutsComponent {
  readonly shortcuts = input<readonly Shortcut[]>([]);

  protected readonly columns = computed(() => {
    const shortcuts = this.shortcuts();
    const minLeftColumnItems = 7;

    if (shortcuts.length <= minLeftColumnItems) {
      return [shortcuts];
    }

    const splitPoint = Math.max(minLeftColumnItems, Math.ceil(shortcuts.length / 2));

    return [shortcuts.slice(0, splitPoint), shortcuts.slice(splitPoint)];
  });
}
