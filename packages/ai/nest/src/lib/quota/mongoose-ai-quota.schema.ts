import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { AiQuotaWindowUnit } from '@otwld/ts-ai';

/** Hydrated quota bucket document. */
export type AiQuotaBucketDocument = HydratedDocument<AiQuotaBucketRecord>;

/** Persistent token usage bucket for one AI quota subject and fixed window. */
@Schema({ timestamps: true })
export class AiQuotaBucketRecord {
  /** Subject kind tracked by this bucket. */
  @Prop({ required: true, enum: ['user'], index: true })
  subjectType!: 'user';

  /** Subject identifier tracked by this bucket. */
  @Prop({ required: true, index: true })
  subjectId!: string;

  /** Stable window key composed from unit, size, and fixed start time. */
  @Prop({ required: true, index: true })
  windowKey!: string;

  /** Window unit for display and diagnostics. */
  @Prop({ required: true, type: String, enum: ['minute', 'hour', 'day', 'week'] })
  windowUnit!: AiQuotaWindowUnit;

  /** Number of units in the fixed window. */
  @Prop({ required: true })
  windowSize!: number;

  /** Start timestamp for the fixed window. */
  @Prop({ required: true })
  windowStartAt!: Date;

  /** Reset timestamp for the fixed window. */
  @Prop({ required: true })
  resetAt!: Date;

  /** Tokens finalized by completed provider calls. */
  @Prop({ required: true, default: 0 })
  usedTokens!: number;

  /** Tokens held by in-flight provider calls. */
  @Prop({ required: true, default: 0 })
  reservedTokens!: number;
}

/** Mongoose schema for AI quota usage buckets. */
export const AiQuotaBucketSchema = SchemaFactory.createForClass(AiQuotaBucketRecord);

AiQuotaBucketSchema.index({ subjectType: 1, subjectId: 1, windowKey: 1 }, { unique: true });
AiQuotaBucketSchema.index({ resetAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 });
