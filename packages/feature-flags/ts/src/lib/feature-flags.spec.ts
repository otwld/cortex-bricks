import {
  BOOLEAN_OPERATORS,
  STRING_OPERATORS,
  createConditionMetaKey,
  createSubject,
  isFeatureFlagAppContext,
} from './feature-flags';

describe('feature flag contracts', () => {
  it('keeps option-backed string metadata to option-safe operators', () => {
    const meta = createConditionMetaKey('department', 'string', async () => ['product']);

    expect(meta.operators).toContainEqual({ name: 'eq', field: 'value' });
    expect(meta.operators).not.toContainEqual({ name: 'regex', field: 'value', disableWhenOptions: true });
  });

  it('creates subject metadata from keyed condition definitions', () => {
    const subject = createSubject({
      scope: 'app',
      conditions: {
        version: createConditionMetaKey('version', 'string'),
        enabled: createConditionMetaKey('enabled', 'boolean'),
      },
    });

    expect(subject.conditions).toHaveLength(2);
    expect(subject.conditions[0].operators).toEqual(STRING_OPERATORS);
    expect(subject.conditions[1].operators).toEqual(BOOLEAN_OPERATORS);
  });

  it('narrows app contexts by the absence of userId', () => {
    expect(isFeatureFlagAppContext({ version: '2026.1.0' })).toBe(true);
    expect(isFeatureFlagAppContext({ userId: 'candidate-42' })).toBe(false);
  });
});
