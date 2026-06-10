import { BadRequestException, Inject, Injectable, NotFoundException, Optional } from '@nestjs/common';
import type {
  ConditionMetaMap,
  FeatureEvaluationResultDto,
  FeatureFlagCatalog,
  FeatureFlagContext,
  FeatureFlagDto as SharedFeatureFlagDto,
  FeatureFlagUpsertDto as SharedFeatureFlagUpsertDto,
  FeatureScope,
  ResolvedConditionMetaMap,
  ResolvedSubjectMeta,
} from '@otwld/ts-feature-flags';
import { isFeatureFlagAppContext } from '@otwld/ts-feature-flags';

import { FeatureFlag } from './feature-flag.entity';
import { FeatureFlagsRepository } from './feature-flags.repository';
import {
  FEATURE_FLAGS_CATALOG_TOKEN,
  FEATURE_FLAGS_CONDITION_META_MAP_TOKEN,
  FEATURE_FLAGS_EVALUATOR_TOKEN,
  FeatureFlagEvaluator,
} from './feature-flags.tokens';

/**
 * Core service for evaluating and managing feature flags.
 */
@Injectable()
export class FeatureFlagsService {
  constructor(
    private readonly repository: FeatureFlagsRepository,
    @Inject(FEATURE_FLAGS_EVALUATOR_TOKEN) private readonly evaluator: FeatureFlagEvaluator,
    @Inject(FEATURE_FLAGS_CONDITION_META_MAP_TOKEN) private readonly conditionMetaMap: ConditionMetaMap,
    @Optional() @Inject(FEATURE_FLAGS_CATALOG_TOKEN) private readonly catalog?: FeatureFlagCatalog,
  ) {}

  /**
   * Evaluate a single feature for a given context.
   */
  async evaluateFeatureForContext(name: string, context: FeatureFlagContext): Promise<FeatureEvaluationResultDto> {
    const doc = await this.repository.findByName(name);
    if (!doc) return { enabled: false, name, slug: name };

    const evaluation = await this.evaluateDocument(doc, context);
    return {
      enabled: evaluation.enabled,
      name: doc.name,
      slug: doc.slug,
      payload: evaluation.payload,
      variant: evaluation.variant,
    };
  }

  /**
   * Metadata for building the admin UI (per scope).
   */
  async getConditionMetaForScope(scope: FeatureScope): Promise<ResolvedConditionMetaMap> {
    const subjectEntries = Object.entries(this.conditionMetaMap);

    const resolvedEntries = await Promise.all(
      subjectEntries.map(async ([subjectName, subjectDetails]) => {
        const resolvedMetas = await Promise.all(
          subjectDetails.conditions.map(async (meta) => {
            let options: string[] | undefined;
            if (meta.options) {
              try {
                options = await meta.options();
              } catch {
                options = [];
              }
            }
            const resolvedMeta: ResolvedSubjectMeta['conditions'][number] = { ...meta, options };
            return resolvedMeta;
          }),
        );
        const resolvedEntry: [string, ResolvedSubjectMeta] = [
          subjectName,
          { ...subjectDetails, conditions: resolvedMetas },
        ];

        return resolvedEntry;
      }),
    );

    return Object.fromEntries(resolvedEntries.filter((entry) => entry[1].scope === scope));
  }

  /**
   * Returns all feature flags, enabled or disabled.
   */
  async listAll(): Promise<SharedFeatureFlagDto[]> {
    return (await this.repository.findAll()).map((feature) => toSharedFeatureFlagDto(feature));
  }

  /**
   * Lists all enabled app-scoped flags for the provided context.
   */
  async listEnabledForContextApp(context: FeatureFlagContext): Promise<FeatureEvaluationResultDto[]> {
    const features = await this.repository.findEnabledByScope('app');
    const evaluations = await Promise.all(features.map((feature) => this.evaluateDocument(feature, context)));

    return features
      .filter((_, index) => evaluations[index].enabled)
      .map((feature, index) => ({
        enabled: evaluations[index].enabled,
        name: feature.name,
        slug: feature.slug,
        payload: evaluations[index].payload,
        variant: evaluations[index].variant,
      }));
  }

  /**
   * Lists all enabled user-scoped flags for the provided context.
   */
  async listEnabledForContextUser(context: FeatureFlagContext): Promise<FeatureEvaluationResultDto[]> {
    const features = await this.repository.findEnabledByScope('user');
    const evaluations = await Promise.all(features.map((feature) => this.evaluateDocument(feature, context)));

    return features
      .filter((_, index) => evaluations[index].enabled)
      .map((feature, index) => ({
        enabled: evaluations[index].enabled,
        name: feature.name,
        slug: feature.slug,
        payload: evaluations[index].payload,
        variant: evaluations[index].variant,
      }));
  }

  /**
   * Creates or updates a feature flag.
   */
  async upsert(dto: SharedFeatureFlagUpsertDto): Promise<SharedFeatureFlagDto> {
    this.assertCatalog(dto);
    const normalized = toFeatureFlagModel(dto);
    const feature = await this.repository.upsert(normalized);
    return toSharedFeatureFlagDto(requireFeatureFlag(feature, dto.name));
  }

  /**
   * Toggles a feature flag without editing other fields.
   */
  async toggle(name: string, enabled: boolean): Promise<SharedFeatureFlagDto> {
    this.assertCatalog({ name });
    const feature = await this.repository.updateEnabled(name, enabled);
    if (!feature) {
      throw new NotFoundException(`Feature not found: ${name}`);
    }

    return toSharedFeatureFlagDto(feature);
  }

  /**
   * Removes a feature flag permanently.
   */
  async remove(name: string): Promise<void> {
    this.assertCatalog({ name });
    await this.repository.delete(name);
  }

  private assertCatalog(dto: Pick<SharedFeatureFlagUpsertDto, 'name'>): void {
    if (this.catalog && !this.catalog[dto.name]) {
      throw new BadRequestException(`Unknown feature: ${dto.name}`);
    }
  }

  private async evaluateDocument(
    doc: FeatureFlag,
    context: FeatureFlagContext,
  ): Promise<{ enabled: boolean; payload?: unknown; variant?: string }> {
    if (!doc.enabled) return { enabled: false };

    const now = new Date();
    if ((doc.startsAt && now.getTime() < doc.startsAt.getTime()) || (doc.endsAt && now > doc.endsAt)) {
      return { enabled: false };
    }

    if (!isFeatureFlagAppContext(context)) {
      if (doc.denyUserIds?.includes(context.userId)) return { enabled: false };
      if (doc.allowUserIds?.includes(context.userId)) {
        return this.resolveVariantEvaluation(doc, context);
      }
    }

    if (!(await this.conditionsPass(doc.conditions, context))) {
      return { enabled: false };
    }

    return this.resolveVariantEvaluation(doc, context);
  }

  private async resolveVariantEvaluation(
    doc: FeatureFlag,
    context: FeatureFlagContext,
  ): Promise<{ enabled: boolean; payload?: unknown; variant?: string }> {
    const basePayload = toRecord(doc.payload);

    for (const variant of doc.variants ?? []) {
      if (!(await this.conditionsPass(variant.conditions, context))) {
        continue;
      }

      return {
        enabled: true,
        payload: mergePayload(basePayload, variant.payload),
        variant: variant.name,
      };
    }

    return { enabled: true, payload: doc.payload };
  }

  private async conditionsPass(conditions: FeatureFlag['conditions'] = [], context: FeatureFlagContext): Promise<boolean> {
    for (const condition of conditions) {
      if (!(await this.evaluator.test(condition, context))) {
        return false;
      }
    }
    return true;
  }
}

function requireFeatureFlag(feature: FeatureFlag | null, name: string): FeatureFlag {
  if (!feature) {
    throw new BadRequestException(`Failed to persist feature: ${name}`);
  }

  return feature;
}

function toFeatureFlagModel(dto: SharedFeatureFlagUpsertDto): Partial<FeatureFlag> & { name: string } {
  return {
    name: dto.name,
    scope: dto.scope,
    enabled: dto.enabled,
    payload: dto.payload,
    variants: dto.variants,
    conditions: dto.conditions,
    allowUserIds: dto.allowUserIds,
    denyUserIds: dto.denyUserIds,
    startsAt: dto.startsAt ? new Date(dto.startsAt) : undefined,
    endsAt: dto.endsAt ? new Date(dto.endsAt) : undefined,
  };
}

function toSharedFeatureFlagDto(feature: FeatureFlag): SharedFeatureFlagDto {
  return {
    _id: feature._id,
    name: feature.name,
    slug: feature.slug,
    scope: feature.scope,
    enabled: feature.enabled,
    payload: feature.payload,
    variants: feature.variants ?? [],
    conditions: feature.conditions,
    allowUserIds: feature.allowUserIds ?? [],
    denyUserIds: feature.denyUserIds ?? [],
    startsAt: toIsoString(feature.startsAt),
    endsAt: toIsoString(feature.endsAt),
    createdBy: feature.createdBy,
    updatedBy: feature.updatedBy,
    createdAt: feature.createdAt.toISOString(),
    updatedAt: feature.updatedAt.toISOString(),
  };
}

function toIsoString(value?: Date): string | undefined {
  return value?.toISOString();
}

function toRecord(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined;
  }

  return { ...value };
}

function mergePayload(
  basePayload: Record<string, unknown> | undefined,
  variantPayload: Record<string, unknown> | undefined,
): Record<string, unknown> | undefined {
  if (!basePayload && !variantPayload) {
    return undefined;
  }

  return {
    ...(basePayload ?? {}),
    ...(variantPayload ?? {}),
  };
}
