import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DeleteResult, Model } from 'mongoose';

import { FeatureFlag, FeatureFlagDocument } from './feature-flag.entity';
import { toKebabSlug } from '@otwld/ts-sdk';
import type { FeatureScope } from '@otwld/ts-feature-flags';

/**
 * Thin data access layer for feature flags.
 */
@Injectable()
export class FeatureFlagsRepository {
  constructor(@InjectModel(FeatureFlag.name) private model: Model<FeatureFlagDocument>) {}

  /** Find a feature by name. */
  findByName(name: string): Promise<FeatureFlag | null> {
    return this.model.findOne({ name }).lean<FeatureFlag>().exec();
  }

  /** Find enabled features by scope (user/app). */
  findEnabledByScope(scope: FeatureScope): Promise<FeatureFlag[]> {
    return this.model
      .find({ scope, enabled: true })
      .exec()
      .then((items) => items.map((item) => item.toObject()));
  }

  /** Find all features (enabled or disabled). */
  findAll(): Promise<FeatureFlag[]> {
    return this.model
      .find({})
      .exec()
      .then((items) => items.map((item) => item.toObject()));
  }

  /** Create or update a feature safely. */
  upsert(dto: Partial<FeatureFlag> & { name: string }): Promise<FeatureFlag | null> {
    return this.model.findOneAndUpdate(
      { name: dto.name },
      {
        $set: { ...dto, slug: toKebabSlug(dto.name) },
      },
      { upsert: true, new: true },
    )
      .exec()
      .then((item) => item?.toObject() ?? null);
  }

  /** Update the enabled state for an existing feature. */
  updateEnabled(name: string, enabled: boolean): Promise<FeatureFlag | null> {
    return this.model
      .findOneAndUpdate(
        { name },
        { $set: { enabled } },
        { new: true, runValidators: true },
      )
      .exec()
      .then((item) => item?.toObject() ?? null);
  }

  /** Remove a feature entirely. */
  delete(name: string): Promise<DeleteResult> {
    return this.model.deleteOne({ name }).exec();
  }
}
