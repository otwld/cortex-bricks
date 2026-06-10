import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { LoaderComponent, StatusBadgeComponent } from '@otwld/ng-ui';
import type {
  FeatureFlagDto,
  FeatureFlagUpsertDto,
  FeatureScope,
} from '@otwld/ts-feature-flags';
import { firstValueFrom, type Observable } from 'rxjs';

import {
  FEATURE_FLAGS_API_TOKEN,
  FeatureFlagsApi,
} from '../../tokens/feature-flags-api.token';
import { FeatureFlagsService } from '../../feature-flags.service';

type FeatureFlagAdminForm = FormGroup<{
  name: FormControl<string>;
  scope: FormControl<FeatureScope>;
  enabled: FormControl<boolean>;
}>;

@Component({
  selector: 'feature-flags-admin',
  standalone: true,
  imports: [
    CommonModule,
    LoaderComponent,
    ReactiveFormsModule,
    StatusBadgeComponent,
  ],
  template: `
    <section class="feature-flags-admin">
      <header class="feature-flags-admin__header">
        <h2>Feature Flags</h2>
        <button type="button" (click)="reload()" [disabled]="isLoading()">Refresh</button>
      </header>

      <form class="feature-flags-admin__form" [formGroup]="form" (ngSubmit)="create()">
        <input formControlName="name" placeholder="feature-name" aria-label="Feature name" />
        <select formControlName="scope" aria-label="Feature scope">
          <option value="app">App</option>
          <option value="user">User</option>
        </select>
        <label>
          <input type="checkbox" formControlName="enabled" />
          Enabled
        </label>
        <button type="submit" [disabled]="form.invalid || isSaving()">Create</button>
      </form>

      @if (isLoading()) {
        <kit-loader mode="block" text="Loading feature flags" />
      } @else {
        <div class="feature-flags-admin__table" role="table">
          <div class="feature-flags-admin__row feature-flags-admin__row--head" role="row">
            <span role="columnheader">Name</span>
            <span role="columnheader">Scope</span>
            <span role="columnheader">Status</span>
            <span role="columnheader">Actions</span>
          </div>

          @for (feature of sortedFeatures(); track feature.name) {
            <div class="feature-flags-admin__row" role="row">
              <span role="cell">{{ feature.name }}</span>
              <span role="cell">{{ feature.scope }}</span>
              <span role="cell">
                <kit-status-badge
                  [label]="feature.enabled ? 'Enabled' : 'Disabled'"
                  [tone]="feature.enabled ? 'positive' : 'neutral'"
                  size="sm"
                />
              </span>
              <span role="cell" class="feature-flags-admin__actions">
                <button type="button" (click)="toggle(feature)" [disabled]="isSaving()">
                  {{ feature.enabled ? 'Disable' : 'Enable' }}
                </button>
                <button type="button" (click)="remove(feature)" [disabled]="isSaving()">
                  Delete
                </button>
              </span>
            </div>
          } @empty {
            <p class="feature-flags-admin__empty">No feature flags found.</p>
          }
        </div>
      }

      @if (message()) {
        <p class="feature-flags-admin__message">{{ message() }}</p>
      }
    </section>
  `,
  styles: [
    `
      .feature-flags-admin {
        display: grid;
        gap: 1rem;
      }

      .feature-flags-admin__header,
      .feature-flags-admin__form,
      .feature-flags-admin__row,
      .feature-flags-admin__actions {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }

      .feature-flags-admin__header {
        justify-content: space-between;
      }

      h2,
      p {
        margin: 0;
      }

      .feature-flags-admin__form {
        flex-wrap: wrap;
      }

      input,
      select,
      button {
        border-radius: 0.375rem;
        border: 1px solid #cbd5e1;
        padding: 0.5rem 0.75rem;
        font: inherit;
      }

      button {
        cursor: pointer;
      }

      button:disabled {
        cursor: not-allowed;
        opacity: 0.6;
      }

      .feature-flags-admin__table {
        display: grid;
        overflow-x: auto;
        border: 1px solid #e2e8f0;
        border-radius: 0.5rem;
      }

      .feature-flags-admin__row {
        display: grid;
        grid-template-columns: minmax(10rem, 1fr) 6rem 8rem auto;
        min-width: 42rem;
        padding: 0.75rem;
        border-bottom: 1px solid #e2e8f0;
      }

      .feature-flags-admin__row:last-child {
        border-bottom: 0;
      }

      .feature-flags-admin__row--head {
        background: #f8fafc;
        font-weight: 700;
      }

      .feature-flags-admin__empty,
      .feature-flags-admin__message {
        color: #475569;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureFlagsAdminComponent {
  private readonly api: FeatureFlagsApi = inject(FEATURE_FLAGS_API_TOKEN);
  private readonly featureFlags = inject(FeatureFlagsService);

  protected readonly features = signal<FeatureFlagDto[]>([]);
  protected readonly isLoading = signal(false);
  protected readonly isSaving = signal(false);
  protected readonly message = signal<string | null>(null);

  protected readonly sortedFeatures = computed(() => {
    return [...this.features()].sort((a, b) => a.name.localeCompare(b.name));
  });

  protected readonly form: FeatureFlagAdminForm = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    scope: new FormControl<FeatureScope>('app', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    enabled: new FormControl(false, { nonNullable: true }),
  });

  constructor() {
    void this.reload();
  }

  async reload(): Promise<void> {
    this.isLoading.set(true);
    this.message.set(null);

    try {
      this.features.set(await firstValueFrom(this.api.list()));
    } catch (error) {
      this.message.set(error instanceof Error ? error.message : 'Unable to load feature flags.');
    } finally {
      this.isLoading.set(false);
    }
  }

  async create(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const dto: FeatureFlagUpsertDto = {
      name: value.name,
      scope: value.scope,
      enabled: value.enabled,
      payload: {},
      variants: [],
      conditions: [],
    };

    await this.save(() => this.api.upsert(dto), `Created "${dto.name}".`);
    this.form.reset({ name: '', scope: 'app', enabled: false });
  }

  async toggle(feature: FeatureFlagDto): Promise<void> {
    await this.save(
      () => this.api.toggle(feature.name, !feature.enabled),
      `${feature.enabled ? 'Disabled' : 'Enabled'} "${feature.name}".`,
    );
  }

  async remove(feature: FeatureFlagDto): Promise<void> {
    await this.save(() => this.api.remove(feature.name), `Deleted "${feature.name}".`);
  }

  private async save(
    operation: () => Observable<unknown>,
    successMessage: string,
  ): Promise<void> {
    this.isSaving.set(true);
    this.message.set(null);

    try {
      await firstValueFrom(operation());
      this.message.set(successMessage);
      await this.reload();
      await this.featureFlags.refreshApp();
      void this.featureFlags.refreshUser();
    } catch (error) {
      this.message.set(error instanceof Error ? error.message : 'Unable to save feature flag.');
    } finally {
      this.isSaving.set(false);
    }
  }
}
