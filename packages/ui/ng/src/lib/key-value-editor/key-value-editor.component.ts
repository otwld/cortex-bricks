import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, input } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';

export type KeyValueFormGroup = FormGroup<{
  key: FormControl<string>;
  value: FormControl<string | number>;
}>;

export type KeyValueFormArray = FormArray<KeyValueFormGroup>;

export function objectToKeyValueFormGroup(
  object: Record<string, string | number>,
): KeyValueFormGroup[] {
  return Object.entries(object).map(([key, value]) => {
    return new FormGroup({
      key: new FormControl(key, {
        nonNullable: true,
        validators: [Validators.required],
      }),
      value: new FormControl(value, {
        nonNullable: true,
        validators: [Validators.required],
      }),
    });
  });
}

export function uniqueKeyValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const formArray = control as KeyValueFormArray;
    const keys = new Set<string>();

    for (const group of formArray.controls) {
      const key = group.controls.key.value.trim().toLowerCase();

      if (keys.has(key)) {
        return { duplicateKey: true };
      }

      keys.add(key);
    }

    return null;
  };
}

export function keyValueArrayToObject(
  keyValueArray: readonly { key: string; value: string | number }[],
): Record<string, string | number> {
  const result: Record<string, string | number> = {};

  for (const item of keyValueArray) {
    result[item.key] = item.value;
  }

  return result;
}

@Component({
  selector: 'kit-key-value-editor',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="kit-key-value-editor" [formGroup]="formGroup">
      <div formArrayName="items" class="kit-key-value-editor__rows">
        @for (group of formArray().controls; track group; let index = $index) {
          <div class="kit-key-value-editor__row" [formGroupName]="index">
            <input formControlName="key" aria-label="Key" />
            <input formControlName="value" aria-label="Value" />
            <button type="button" (click)="removeKeyValuePair(index)">Remove</button>
          </div>
        }
      </div>
      <button type="button" (click)="addKeyValuePair()">Add</button>
    </div>
  `,
  styles: [
    `
      .kit-key-value-editor,
      .kit-key-value-editor__rows {
        display: grid;
        gap: 0.75rem;
      }

      .kit-key-value-editor__row {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto;
        gap: 0.5rem;
      }

      input,
      button {
        border-radius: 0.375rem;
        border: 1px solid #cbd5e1;
        padding: 0.5rem 0.75rem;
        font: inherit;
      }

      button {
        cursor: pointer;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KeyValueEditorComponent {
  readonly formArray = input.required<KeyValueFormArray>();

  protected readonly formGroup = new FormGroup({
    items: new FormArray<KeyValueFormGroup>([]),
  });

  constructor() {
    effect(() => {
      const formArray = this.formArray();

      this.formGroup.setControl('items', formArray);

      if (!formArray.hasValidator(uniqueKeyValidator)) {
        formArray.addValidators(uniqueKeyValidator());
      }
    });
  }

  addKeyValuePair(): void {
    const formArray = this.formArray();

    if (formArray.invalid) {
      formArray.markAllAsTouched();
      formArray.updateValueAndValidity();
      return;
    }

    formArray.push(objectToKeyValueFormGroup({ [`key_${formArray.length + 1}`]: '' })[0]);
    formArray.updateValueAndValidity();
  }

  removeKeyValuePair(index: number): void {
    this.formArray().removeAt(index);
  }
}
