import type { NestedPath, PaginationQuery, PaginationResult, RangeLike } from '@otwld/ts-sdk';
import { Model, PipelineStage, UpdateQuery } from 'mongoose';

import type { IdLike } from '../types/id-like';
import type { MatchRule, MongooseFilterQuery } from '../types/match-rule';
import { buildMatchStage } from '../utils/build-match-stage';
import { buildPipeline } from '../utils/build-pipeline';
import { buildRelationLookup, buildRelationsLookup } from '../utils/build-relation-lookup';
import { buildFacet, buildPaginatedFacet } from '../utils/facet';
import { toObjectId, toObjectIds } from '../utils/object-id';

/**
 * Base repository providing reusable MongoDB aggregation helpers.
 *
 * @template TMatch - DTO type used to construct the `$match` stage.
 * @template TEntity - The root Mongoose document type.
 * @template TEntityWithRelations - Document type including related lookups.
 */
export abstract class AbstractRepository<
  TMatch,
  TEntity,
  TEntityWithRelations,
  TCreate = Partial<TEntity>,
  TUpdate = Partial<TEntity>,
> {
  /**
   * Additional lookup pipelines appended during paginated relation aggregation.
   */
  public abstract relationLookups: PipelineStage.FacetPipelineStage[];

  /**
   * Default sort order applied to all aggregations.
   * Sorts newest documents first.
   */
  public readonly sort: PipelineStage.Sort = { $sort: { createdAt: -1, _id: -1 } };

  /**
   * @param model - The underlying Mongoose model used for all queries.
   */
  protected constructor(protected readonly model: Model<TEntity>) {}

  /**
   * Builds a lookup stage for a **single-related document**.
   */
  protected buildRelationLookup<V>(
    model: Model<V>,
    localField: Extract<keyof TEntity, string>,
    foreignField: Extract<keyof V, string>,
    as: string,
  ): PipelineStage.FacetPipelineStage[] {
    return buildRelationLookup<TEntity, V>(model.collection.name, localField, foreignField, as);
  }

  /**
   * Builds a lookup stage for a **related collection using a sub-pipeline**.
   */
  protected buildRelationsLookup<V>(
    model: Model<V>,
    localField: Extract<keyof TEntity, string>,
    foreignField: Extract<keyof V, string>,
    as: string,
    pipeline: PipelineStage.FacetPipelineStage[],
  ): PipelineStage.FacetPipelineStage[] {
    return buildRelationsLookup<TEntity, V>(model.collection.name, localField, foreignField, as, pipeline);
  }

  /**
   * Concrete repositories must define match rules.
   */
  protected abstract matchRules(): readonly MatchRule<TEntity, TMatch>[];

  /**
   * Extra fields or lookups that apply to all aggregations.
   */
  protected extraFields(): readonly (PipelineStage.AddFields | PipelineStage.Lookup | PipelineStage.Unset)[] {
    return [];
  }

  /**
   * Builds the `$match` stage for a DTO.
   */
  protected buildMatch(dto: TMatch): PipelineStage.Match {
    return buildMatchStage<TEntity, TMatch>(dto, this.matchRules());
  }

  /**
   * Internal helper to read DTO values without `any`.
   */
  protected getDtoValue<D extends Extract<keyof TMatch, string>>(dto: TMatch, field: D): TMatch[D] {
    return (dto as Record<string, unknown>)[field] as TMatch[D];
  }

  /**
   * Internal helper to set a match field without `any`.
   */
  protected setMatchField<K extends string>(
    match: MongooseFilterQuery<TEntity>,
    field: K,
    value: unknown,
  ): void {
    (match as Record<string, unknown>)[field] = value;
  }

  /**
   * Internal helper to merge an existing match field without `any`.
   */
  protected mergeMatchField<K extends string>(
    match: MongooseFilterQuery<TEntity>,
    field: K,
    value: Record<string, unknown>,
  ): void {
    const record = match as Record<string, unknown>;
    const existing = record[field];
    if (existing && typeof existing === 'object') {
      record[field] = { ...(existing as Record<string, unknown>), ...value };
      return;
    }
    record[field] = value;
  }

  /**
   * Adds `$text` search with a string DTO field.
   */
  protected textSearch<D extends Extract<keyof TMatch, string>>(dtoField: D): MatchRule<TEntity, TMatch> {
    return (match, dto) => {
      const raw = this.getDtoValue(dto, dtoField);
      if (typeof raw !== 'string') return;

      const q = raw.trim();
      if (!q) return;

      this.setMatchField(match, '$text', { $search: q });
    };
  }

  /**
   * Matches a date range between two DTO fields.
   */
  protected dateBetween<
    K extends Extract<keyof TEntity, string>,
    DS extends Extract<keyof TMatch, string>,
    DE extends Extract<keyof TMatch, string>,
  >(entityDateField: K, dtoStartField: DS, dtoEndField: DE): MatchRule<TEntity, TMatch> {
    return (match, dto) => {
      const start = this.getDtoValue(dto, dtoStartField) as Date | string | undefined;
      const end = this.getDtoValue(dto, dtoEndField) as Date | string | undefined;

      if (!start && !end) return;

      const range: Record<string, Date> = {};
      if (start) range['$gte'] = new Date(start);
      if (end) range['$lte'] = new Date(end);

      this.setMatchField(match, entityDateField, range);
    };
  }

  /**
   * Matches a DTO string field as an ObjectId against an entity field.
   */
  protected eqObjectId<K extends Extract<keyof TEntity, string>, D extends Extract<keyof TMatch, string>>(
    entityField: K,
    dtoField: D,
  ): MatchRule<TEntity, TMatch> {
    return (match, dto) => {
      const v = this.getDtoValue(dto, dtoField);
      if (typeof v !== 'string' || !v) return;
      this.setMatchField(match, entityField, toObjectId(v));
    };
  }

  /**
   * Case-insensitive regex search on a string field.
   * Uses `$regex` (not $text). Escapes input by default to avoid regex injection.
   */
  protected regexSearch<K extends Extract<keyof TEntity, string>, D extends Extract<keyof TMatch, string>>(
    entityField: K,
    dtoField: D,
    opts?: { caseInsensitive?: boolean; escape?: boolean },
  ): MatchRule<TEntity, TMatch> {
    const caseInsensitive = opts?.caseInsensitive ?? true;
    const escape = opts?.escape ?? true;

    const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    return (match, dto) => {
      const raw = this.getDtoValue(dto, dtoField);
      if (typeof raw !== 'string') return;

      const q = raw.trim();
      if (!q) return;

      const pattern = escape ? escapeRegExp(q) : q;

      this.setMatchField(match, entityField, {
        $regex: pattern,
        ...(caseInsensitive ? { $options: 'i' } : {}),
      });
    };
  }

  /**
   * Matches dates between two DTO fields (string or Date).
   */
  protected dateRange<
    K extends Extract<keyof TEntity, string>,
    DS extends Extract<keyof TMatch, string>,
    DE extends Extract<keyof TMatch, string>,
  >(entityDateField: K, dtoStartField: DS, dtoEndField: DE): MatchRule<TEntity, TMatch> {
    return (match, dto) => {
      const start = this.getDtoValue(dto, dtoStartField) as string | Date | undefined;
      const end = this.getDtoValue(dto, dtoEndField) as string | Date | undefined;
      if (!start && !end) return;

      const range: Record<string, Date> = {};
      if (start) range['$gte'] = new Date(start);
      if (end) range['$lte'] = new Date(end);

      this.setMatchField(match, entityDateField, range);
    };
  }

  /**
   * Matches values less than a DTO field.
   */
  protected dateLessThan<K extends Extract<keyof TEntity, string>, D extends Extract<keyof TMatch, string>>(
    entityField: K,
    dtoField: D,
  ): MatchRule<TEntity, TMatch> {
    return (match, dto) => {
      const value = this.getDtoValue(dto, dtoField) as Date | string | undefined;
      if (!value) return;

      this.mergeMatchField(match, entityField, { $lt: new Date(value) });
    };
  }

  /**
   * Adds `{ entityField: { $in: objectIds(dto[dtoField]) } }` for arrays.
   */
  protected inObjectIds<K extends Extract<keyof TEntity, string>, D extends Extract<keyof TMatch, string>>(
    entityField: K,
    dtoField: D,
  ): MatchRule<TEntity, TMatch> {
    return (match, dto) => {
      const values = this.getDtoValue(dto, dtoField);
      if (Array.isArray(values) && values.length) {
        this.setMatchField(match, entityField, { $in: toObjectIds(values as IdLike[]) });
      }
    };
  }

  /**
   * Adds `{ entityField: { $in: dto[dtoField] } }` for arrays.
   */
  protected inArray<K extends Extract<keyof TEntity, string>, D extends Extract<keyof TMatch, string>>(
    entityField: K,
    dtoField: D,
  ): MatchRule<TEntity, TMatch> {
    return (match, dto) => {
      const values = this.getDtoValue(dto, dtoField);
      if (Array.isArray(values) && values.length) {
        this.setMatchField(match, entityField, { $in: values });
      }
    };
  }

  /**
   * Adds `{ entityField: boolean }` if DTO field is boolean.
   */
  protected eqBoolean<K extends Extract<keyof TEntity, string>, D extends Extract<keyof TMatch, string>>(
    entityField: K,
    dtoField: D,
  ): MatchRule<TEntity, TMatch> {
    return (match, dto) => {
      const v = this.getDtoValue(dto, dtoField);
      if (typeof v === 'boolean') this.setMatchField(match, entityField, v);
    };
  }

  /**
   * Adds `{ entityField: dtoValue }` when dtoValue is not null/undefined.
   */
  protected eqDefined<K extends Extract<keyof TEntity, string>, D extends Extract<keyof TMatch, string>>(
    entityField: K,
    dtoField: D,
  ): MatchRule<TEntity, TMatch> {
    return (match, dto) => {
      const v = this.getDtoValue(dto, dtoField);
      if (v !== undefined && v !== null) this.setMatchField(match, entityField, v);
    };
  }

  /**
   * Nested-field equality like `declaredFire.confirmed` using Mongo dot notation.
   */
  protected eqNestedDefined<D extends Extract<keyof TMatch, string>>(
    entityPath: NestedPath<Required<TEntity>>,
    dtoField: D,
    pick: (dtoValue: NonNullable<TMatch[D]>) => unknown,
  ): MatchRule<TEntity, TMatch> {
    return (match, dto) => {
      const raw = this.getDtoValue(dto, dtoField);
      if (raw === undefined || raw === null) return;

      const v = pick(raw as NonNullable<TMatch[D]>);
      if (v !== undefined) this.setMatchField(match, entityPath, v);
    };
  }

  /**
   * Date/number range builder from `{ gt/gte/lt/lte }`.
   */
  protected rangeFromDto<K extends Extract<keyof TEntity, string>, D extends Extract<keyof TMatch, string>>(
    entityField: K,
    dtoField: D,
    opts?: { coerce?: (value: unknown) => unknown },
  ): MatchRule<TEntity, TMatch> {
    const coerce = opts?.coerce ?? ((value: unknown) => value);
    return (match, dto) => {
      const r = this.getDtoValue(dto, dtoField) as RangeLike | undefined;
      if (!r) return;

      const q: Record<string, unknown> = {};
      if (r.gt !== undefined) q['$gt'] = coerce(r.gt);
      if (r.gte !== undefined) q['$gte'] = coerce(r.gte);
      if (r.lt !== undefined) q['$lt'] = coerce(r.lt);
      if (r.lte !== undefined) q['$lte'] = coerce(r.lte);

      if (Object.keys(q).length) {
        this.mergeMatchField(match, entityField, q);
      }
    };
  }

  /**
   * Convenience: range where values are dates (string|Date -> Date).
   */
  protected dateRangeFromDto<K extends Extract<keyof TEntity, string>, D extends Extract<keyof TMatch, string>>(
    entityField: K,
    dtoField: D,
  ): MatchRule<TEntity, TMatch> {
    return this.rangeFromDto(entityField, dtoField, { coerce: (value) => new Date(value as string | number) });
  }

  /**
   * Convenience: range where values are numbers.
   */
  protected numberRangeFromDto<K extends Extract<keyof TEntity, string>, D extends Extract<keyof TMatch, string>>(
    entityField: K,
    dtoField: D,
  ): MatchRule<TEntity, TMatch> {
    return this.rangeFromDto(entityField, dtoField, { coerce: (value) => Number(value) });
  }

  /**
   * Maps a DTO enum level to a Mongo range on a numeric field.
   */
  protected mappedRange<K extends Extract<keyof TEntity, string>, D extends Extract<keyof TMatch, string>>(
    entityField: K,
    dtoField: D,
    mapper: (dtoValue: NonNullable<TMatch[D]>) => Record<string, unknown> | null | undefined,
  ): MatchRule<TEntity, TMatch> {
    return (match, dto) => {
      const level = this.getDtoValue(dto, dtoField);
      if (level === undefined || level === null) return;

      const range = mapper(level as NonNullable<TMatch[D]>);
      if (range && Object.keys(range).length) {
        this.setMatchField(match, entityField, range);
      }
    };
  }

  /**
   * Creates a new entity.
   *
   * Returns a plain object (lean), not a hydrated document.
   */
  public async create(dto: TCreate): Promise<TEntity> {
    const [created] = await this.model.insertMany([dto], { ordered: true });
    return (created.toObject ? created.toObject() : created) as TEntity;
  }

  /**
   * Creates many entities in a single operation.
   */
  public async createMany(dtos: readonly TCreate[]): Promise<TEntity[]> {
    if (!dtos.length) return [];
    const created = await this.model.insertMany(dtos, { ordered: true });
    return created.map((doc) => (doc?.toObject ? doc.toObject() : doc)) as TEntity[];
  }

  /**
   * Updates a single entity by id and returns the updated value.
   */
  public async updateById(id: string, dto: TUpdate): Promise<TEntity | null> {
    const updated = await this.model
      .findByIdAndUpdate(toObjectId(id), { $set: dto } as UpdateQuery<TEntity>, {
        new: true,
        runValidators: true,
      })
      .lean<TEntity>()
      .exec();

    return updated ?? null;
  }

  /**
   * Partially updates a single entity matching a filter and returns updated value.
   */
  public async updateOne(
    filter: MongooseFilterQuery<TEntity>,
    dto: TUpdate,
  ): Promise<TEntity | null> {
    const updated = await this.model
      .findOneAndUpdate(filter, { $set: dto } as UpdateQuery<TEntity>, {
        new: true,
        runValidators: true,
      })
      .lean<TEntity>()
      .exec();

    return updated ?? null;
  }

  /** Execute a paginated aggregation without relational lookups. */
  public async aggregate(dto: TMatch, pagination?: PaginationQuery): Promise<PaginationResult<TEntity>> {
    const pipeline = buildPipeline(
      this.buildMatch(dto),
      this.sort,
      buildPaginatedFacet(pagination, this.extraFields()),
    );

    const [result] = await this.model.aggregate<PaginationResult<TEntity>>(pipeline).exec();

    return result;
  }

  /** Execute a non-paginated aggregation without relational lookups. */
  public async aggregateOne(dto: TMatch): Promise<TEntity | null> {
    const pipeline = buildPipeline(this.buildMatch(dto), this.sort, buildFacet([], this.extraFields()));

    const [result] = await this.model.aggregate<TEntity>(pipeline).exec();

    return result ?? null;
  }

  /** Execute a paginated aggregation with relational lookups. */
  public async aggregateWithRelations(
    dto: TMatch,
    pagination?: PaginationQuery,
  ): Promise<PaginationResult<TEntityWithRelations>> {
    const pipeline = buildPipeline(
      this.buildMatch(dto),
      this.sort,
      buildPaginatedFacet(pagination, this.relationLookups, this.extraFields()),
    );

    const [result] = await this.model.aggregate<PaginationResult<TEntityWithRelations>>(pipeline).exec();

    return result;
  }

  /** Execute a non-paginated aggregation with relational lookups. */
  public async aggregateOneWithRelation(dto: TMatch): Promise<TEntityWithRelations | null> {
    const pipeline = buildPipeline(
      this.buildMatch(dto),
      this.sort,
      buildFacet(this.relationLookups, this.extraFields()),
    );

    const [result] = await this.model.aggregate<TEntityWithRelations>(pipeline).exec();

    return result ?? null;
  }
}
