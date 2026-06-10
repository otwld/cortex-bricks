import { FormArray } from '@angular/forms';

import {
  keyValueArrayToObject,
  objectToKeyValueFormGroup,
  uniqueKeyValidator,
} from './key-value-editor.component';

describe('key-value editor helpers', () => {
  it('validates duplicate keys case-insensitively', () => {
    const formArray = new FormArray([
      objectToKeyValueFormGroup({ Department: 'Product' })[0],
      objectToKeyValueFormGroup({ department: 'Design' })[0],
    ]);

    formArray.addValidators(uniqueKeyValidator());
    formArray.updateValueAndValidity();

    expect(formArray.errors).toEqual({ duplicateKey: true });
  });

  it('maps key-value rows back into an object', () => {
    expect(
      keyValueArrayToObject([
        { key: 'limit', value: 10 },
        { key: 'scope', value: 'candidate' },
      ]),
    ).toEqual({ limit: 10, scope: 'candidate' });
  });
});
