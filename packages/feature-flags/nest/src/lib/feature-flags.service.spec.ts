import { NotFoundException } from '@nestjs/common';
import { validate } from 'class-validator';
import { FeatureScope } from '@otwld/ts-feature-flags';

import type { FeatureFlag } from './feature-flag.entity';
import { FeatureFlagUpsertDto } from './feature-flags.dtos';
import type { FeatureFlagsRepository } from './feature-flags.repository';
import { FeatureFlagsService } from './feature-flags.service';
import type { FeatureFlagEvaluator } from './feature-flags.tokens';

type RepositoryMock = {
  updateEnabled: ReturnType<typeof vi.fn>;
  upsert: ReturnType<typeof vi.fn>;
};

function createService(repository: RepositoryMock): FeatureFlagsService {
  const evaluator: FeatureFlagEvaluator = {
    test: vi.fn().mockResolvedValue(true),
  };

  return new FeatureFlagsService(
    repository as unknown as FeatureFlagsRepository,
    evaluator,
    {},
  );
}

function createFeature(overrides: Partial<FeatureFlag> = {}): FeatureFlag {
  return {
    _id: 'feature-1',
    name: 'Candidate beta',
    slug: 'candidate-beta',
    scope: 'user',
    enabled: false,
    payload: {},
    variants: [],
    conditions: [],
    allowUserIds: [],
    denyUserIds: [],
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    ...overrides,
  };
}

describe(FeatureFlagsService.name, () => {
  it('toggles an existing flag without upserting a partial document', async () => {
    const repository: RepositoryMock = {
      updateEnabled: vi.fn().mockResolvedValue(createFeature({ enabled: true })),
      upsert: vi.fn(),
    };
    const service = createService(repository);

    await expect(service.toggle('Candidate beta', true)).resolves.toMatchObject({
      enabled: true,
      name: 'Candidate beta',
      scope: 'user',
    });
    expect(repository.updateEnabled).toHaveBeenCalledWith('Candidate beta', true);
    expect(repository.upsert).not.toHaveBeenCalled();
  });

  it('rejects toggles for missing flags instead of creating incomplete flags', async () => {
    const repository: RepositoryMock = {
      updateEnabled: vi.fn().mockResolvedValue(null),
      upsert: vi.fn(),
    };
    const service = createService(repository);

    await expect(service.toggle('Missing flag', true)).rejects.toBeInstanceOf(NotFoundException);
    expect(repository.upsert).not.toHaveBeenCalled();
  });
});

describe(FeatureFlagUpsertDto.name, () => {
  it('accepts non-Mongo identity strings in user allow and deny lists', async () => {
    const dto = Object.assign(new FeatureFlagUpsertDto(), {
      name: 'Candidate beta',
      scope: FeatureScope.USER,
      enabled: true,
      conditions: [],
      allowUserIds: ['candidate-42'],
      denyUserIds: ['auth0|user-1'],
    });

    await expect(validate(dto)).resolves.toEqual([]);
  });
});
