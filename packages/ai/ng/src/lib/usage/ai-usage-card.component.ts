import { DecimalPipe } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, inject, input, signal } from '@angular/core';
import { AiQuotaUsageBucket, AiQuotaUsageSnapshot } from '@otwld/ts-ai';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ProgressBarModule } from 'primeng/progressbar';
import { SkeletonModule } from 'primeng/skeleton';
import { AiUsageService } from '../services/ai-usage.service';

/** PrimeNG card that displays the current user's AI quota usage. */
@Component({
  selector: 'ai-usage-card',
  imports: [ButtonModule, CardModule, DecimalPipe, ProgressBarModule, SkeletonModule],
  template: `
    <p-card styleClass="ai-usage-card">
      <div class="flex items-center justify-between gap-3">
        <div>
          <h2 class="text-base font-semibold text-surface-900 dark:text-surface-0">AI Usage</h2>
          @if (snapshot()?.maxPromptTokens) {
            <p class="mt-1 text-sm text-surface-500">Prompt limit {{ snapshot()?.maxPromptTokens | number }} tokens</p>
          }
        </div>
        <p-button icon="pi pi-refresh" [rounded]="true" [text]="true" [loading]="loading()" ariaLabel="Refresh AI usage" (onClick)="refresh()" />
      </div>

      <div class="mt-4">
        @if (loading() && !snapshot()) {
          <div class="flex flex-col gap-3">
            <p-skeleton height="1rem" />
            <p-skeleton height="0.75rem" />
            <p-skeleton height="0.75rem" />
          </div>
        } @else if (error()) {
          <div class="flex items-center justify-between gap-3 text-sm text-red-500">
            <span>{{ error() }}</span>
            <p-button label="Retry" icon="pi pi-refresh" size="small" severity="secondary" [outlined]="true" (onClick)="refresh()" />
          </div>
        } @else {
          <div class="flex flex-col gap-4">
            @for (bucket of buckets(); track bucket.window.unit + ':' + bucket.window.size) {
              <div class="flex flex-col gap-2">
                <div class="flex items-center justify-between gap-3 text-sm">
                  <span class="font-medium text-surface-700 dark:text-surface-200">{{ windowLabel(bucket) }}</span>
                  <span [class]="bucketClass(bucket)">{{ bucket.usedTokens | number }} / {{ bucket.limitTokens | number }}</span>
                </div>
                <p-progressbar [value]="percent(bucket)" [showValue]="false" styleClass="h-2" />
                <div class="flex items-center justify-between gap-3 text-xs text-surface-500">
                  <span>{{ bucket.remainingTokens | number }} remaining</span>
                  <span>Resets {{ resetLabel(bucket) }}</span>
                </div>
              </div>
            } @empty {
              <p class="text-sm text-surface-500">No quota windows are configured.</p>
            }
          </div>
        }
      </div>
    </p-card>
  `,
})
export class AiUsageCardComponent implements OnInit, OnDestroy {
  private readonly usage = inject(AiUsageService);
  private intervalId: ReturnType<typeof setInterval> | null = null;

  /** Optional refresh interval in milliseconds. */
  readonly autoRefreshMs = input<number | undefined>();
  /** Current usage snapshot. */
  readonly snapshot = signal<AiQuotaUsageSnapshot | null>(null);
  /** Loading state for the usage request. */
  readonly loading = signal(false);
  /** Inline usage loading error. */
  readonly error = signal<string | null>(null);
  /** Buckets shown by the card. */
  readonly buckets = computed(() => this.snapshot()?.buckets ?? []);

  /** Loads usage and starts optional auto-refresh. */
  ngOnInit(): void {
    void this.refresh();
    const autoRefreshMs = this.autoRefreshMs();
    if (autoRefreshMs && autoRefreshMs > 0) {
      this.intervalId = setInterval(() => void this.refresh(), autoRefreshMs);
    }
  }

  /** Stops the optional auto-refresh timer. */
  ngOnDestroy(): void {
    if (this.intervalId) clearInterval(this.intervalId);
  }

  /** Refreshes the usage snapshot. */
  async refresh(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      this.snapshot.set(await this.usage.snapshot());
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'AI usage is unavailable');
    } finally {
      this.loading.set(false);
    }
  }

  /** Returns the percentage of the bucket already consumed or reserved. */
  /**
   * Runs percent.
   *
   * @param bucket - bucket value.
   *
   * @returns The ai usage card component percent result.
   */
  percent(bucket: AiQuotaUsageBucket): number {
    if (bucket.limitTokens === 0) return 0;
    return Math.min(100, Math.round(((bucket.usedTokens + bucket.reservedTokens) / bucket.limitTokens) * 100));
  }

  /** Returns a compact label for a quota bucket window. */
  /**
   * Runs window label.
   *
   * @param bucket - bucket value.
   *
   * @returns The ai usage card component window label result.
   */
  windowLabel(bucket: AiQuotaUsageBucket): string {
    const unit = bucket.window.size === 1 ? bucket.window.unit : `${bucket.window.unit}s`;
    return `${bucket.window.size} ${unit}`;
  }

  /** Returns a local reset timestamp label. */
  /**
   * Runs reset label.
   *
   * @param bucket - bucket value.
   *
   * @returns The ai usage card component reset label result.
   */
  resetLabel(bucket: AiQuotaUsageBucket): string {
    return new Date(bucket.resetAt).toLocaleString();
  }

  /** Returns usage text severity classes for the bucket. */
  /**
   * Runs bucket class.
   *
   * @param bucket - bucket value.
   *
   * @returns The ai usage card component bucket class result.
   */
  bucketClass(bucket: AiQuotaUsageBucket): string {
    if (bucket.exceeded) return 'font-semibold text-red-500';
    if (this.percent(bucket) >= 80) return 'font-semibold text-amber-500';
    return 'font-semibold text-surface-700 dark:text-surface-200';
  }
}
