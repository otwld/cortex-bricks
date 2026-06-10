import { randomUUID } from 'node:crypto';
import { model as createModel, Schema, type Model, type PipelineStage } from 'mongoose';

import { AbstractRepository } from './abstract-repository';
import type { MatchRule } from '../types';

interface TestEntity {
  _id: string;
  createdAt: Date;
  ownerId: string;
}

interface TestEntityWithRelations extends TestEntity {
  owner: { _id: string };
}

type EmptyMatchDto = Record<string, never>;

class TestRepository extends AbstractRepository<EmptyMatchDto, TestEntity, TestEntityWithRelations> {
  public relationLookups: PipelineStage.FacetPipelineStage[] = [];

  constructor(model: Model<TestEntity>) {
    super(model);
  }

  protected matchRules(): readonly MatchRule<TestEntity, EmptyMatchDto>[] {
    return [];
  }
}

describe(AbstractRepository.name, () => {
  it('returns the first aggregate document from aggregateOneWithRelation', async () => {
    const expected: TestEntityWithRelations = {
      _id: 'entity-1',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      ownerId: 'owner-1',
      owner: { _id: 'owner-1' },
    };
    const model = createModel<TestEntity>(
      `AbstractRepositorySpecEntity_${randomUUID()}`,
      new Schema<TestEntity>(),
    );
    const aggregate = model.aggregate<TestEntityWithRelations>();
    vi.spyOn(aggregate, 'exec').mockResolvedValue([expected]);
    vi.spyOn(model, 'aggregate').mockReturnValue(aggregate);
    const repository = new TestRepository(model);

    await expect(repository.aggregateOneWithRelation({})).resolves.toEqual(expected);
  });
});
