import { AbstractControl, FormArray, FormControl, FormGroup } from '@angular/forms';

import { NonUndefined, Primitive } from '@otwld/ts-sdk';

interface MarkTreeOptions {
  /**
   * If true (default), a final validity update will be emitted at the root.
   * Internal recursive steps suppress events for performance.
   */
  emitEvent?: boolean;
}

/**
 * Deeply marks an Angular form control tree (FormGroup/FormArray/FormControl) as
 * touched & dirty, and updates validity for every node.
 *
 * - Skips disabled controls.
 * - Uses `onlySelf: true` and `emitEvent: false` for internal nodes to avoid redundant emissions.
 * - Performs a single final `updateValueAndValidity` at the root when `emitEvent` is true.
 *
 * @param root   Root control to process (FormGroup, FormArray, or FormControl).
 * @param options Optional behavior flags (see {@link MarkTreeOptions}).
 *
 * @example
 * // In a component with a FormGroup `form`:
 * this.markControlTreeTouchedDirtyAndUpdateValidity(this.form);
 */
export function markControlTreeTouchedDirtyAndUpdateValidity(
  root: AbstractControl,
  options: MarkTreeOptions = {},
): void {
  const { emitEvent = true } = options;

  const isGroup = (c: AbstractControl): c is FormGroup => c instanceof FormGroup;
  const isArray = (c: AbstractControl): c is FormArray => c instanceof FormArray;

  // Depth-first traversal that suppresses events for inner updates.
  const visit = (ctrl: AbstractControl): void => {
    if (!ctrl || ctrl.disabled) return;

    // Recurse into containers first
    if (isGroup(ctrl)) {
      // Object.values is safe; Angular stores plain object of controls
      for (const child of Object.values(ctrl.controls)) visit(child);
    } else if (isArray(ctrl)) {
      for (const child of ctrl.controls) visit(child);
    }

    // Mark state locally without bubbling emissions on each node
    ctrl.markAsTouched({ onlySelf: true });
    ctrl.markAsDirty({ onlySelf: true });
    ctrl.updateValueAndValidity({ onlySelf: true, emitEvent: false });
  };

  visit(root);

  // Single final validity recomputation + emission at the root if requested
  if (emitEvent) {
    root.updateValueAndValidity({ onlySelf: false, emitEvent: true });
  }
}

/**
 * Map an object type T to its controls map (used by FormGroup).
 * When Flat=true this mapping is unused (objects resolve to FormControl<T>),
 * but keeping the signature makes the types composable.
 */
export type NonNullableControlsOf<T extends object, Flat extends boolean = false, Leaf = never> = {
  // optional props become required control entries; strip `undefined`
  [K in keyof T]-?: NonNullableControlOf<NonUndefined<T[K]>, Flat, Leaf>;
};

/**
 * Like NonNullableControlsOf but preserves the optionality of the original type T.
 * Optional properties remain optional in the controls map, and their corresponding control
 * value types keep `undefined` where applicable.
 */
export type ControlsOf<T extends object, Flat extends boolean = false, Leaf = never> = {
  // Optional properties become required control entries; keep `undefined` in the control's value type
  [K in keyof T]-?: ControlOf<T[K], Flat, Leaf>;
};

/**
 * Produce the AbstractControl type for any T (non-nullable variant).
 *
 * Rules:
 * - Arrays (incl. readonly) → FormArray<ControlOf<Element>>
 * - Objects → FormGroup<ControlsOf<T>>
 * - Primitives/Leaf → FormControl<T>
 * - When Flat=true → Arrays and Objects become FormControl<T> instead.
 *
 * You can pass Leaf to treat specific object types (e.g., Date, File) as primitives.
 */
export type NonNullableControlOf<T, Flat extends boolean = false, Leaf = never> =
  // Readonly arrays first
  [NonUndefined<T>] extends [readonly (infer U)[]]
    ? Flat extends true
      ? FormControl<NonUndefined<T>>
      : FormArray<NonNullableControlOf<U, Flat, Leaf>>
    : // Mutable arrays
      [NonUndefined<T>] extends [(infer U)[]]
      ? Flat extends true
        ? FormControl<NonUndefined<T>>
        : FormArray<NonNullableControlOf<U, Flat, Leaf>>
      : // Primitives or custom "leaf" types → FormControl
        [T] extends [Primitive | Leaf]
        ? FormControl<NonUndefined<T>>
        : // Objects → FormGroup (or FormControl when Flat=true)
          [T] extends [object]
          ? Flat extends true
            ? FormControl<NonUndefined<T>>
            : FormGroup<NonNullableControlsOf<T & object, Flat, Leaf>>
          : // Fallback → FormControl
            FormControl<NonUndefined<T>>;

/**
 * Produce the AbstractControl type for any T (nullable-aware variant that preserves undefined in value type
 * and respects optional properties).
 */
export type ControlOf<T, Flat extends boolean = false, Leaf = never> =
  // Readonly arrays first (use NonUndefined<T> to discriminate, but keep T for value types)
  [NonUndefined<T>] extends [readonly (infer U)[]]
    ? Flat extends true
      ? FormControl<T>
      : FormArray<ControlOf<U, Flat, Leaf>>
    : // Mutable arrays
      [NonUndefined<T>] extends [(infer U)[]]
      ? Flat extends true
        ? FormControl<T>
        : FormArray<ControlOf<U, Flat, Leaf>>
      : // Primitives or custom "leaf" types → FormControl
        [T] extends [Primitive | Leaf]
        ? FormControl<T>
        : // Objects → FormGroup (or FormControl when Flat=true). Use NonUndefined<T> for structure
          [NonUndefined<T>] extends [object]
          ? Flat extends true
            ? FormControl<T>
            : FormGroup<ControlsOf<NonUndefined<T> & object, Flat, Leaf>>
          : // Fallback → FormControl
            FormControl<T>;

/** Convenience: wrapped FormGroup from an object shape (non-nullable). */
export type NonNullableFormGroupOf<T extends object, Flat extends boolean = false, Leaf = never> = FormGroup<
  NonNullableControlsOf<T, Flat, Leaf>
>;

/** Convenience: wrapped FormGroup from an object shape (nullable-aware). */
export type FormGroupOf<T extends object, Flat extends boolean = false, Leaf = never> = FormGroup<
  ControlsOf<T, Flat, Leaf>
>;

/**
 * Picks a subset of controls from a controls map, preserving types.
 */
export function pickControls<T extends Record<string, AbstractControl>, const K extends readonly (keyof T)[]>(
  src: T,
  keys: K,
): { [P in K[number]]: T[P] } {
  const out = {} as { [P in K[number]]: T[P] };
  for (const k of keys) {
    // Single, safe assertion to satisfy TS’s indexed-write check:
    (out as Record<string, AbstractControl>)[k as string] = src[k];
  }
  return out as { [P in K[number]]: T[P] };
}
