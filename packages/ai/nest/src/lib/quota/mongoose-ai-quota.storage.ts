import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  AiQuotaLimit,
  AiQuotaSubject,
  AiQuotaUsageBucket,
  AiUsage,
  createAiQuotaWindowKey,
  getAiQuotaWindowReset,
  getAiQuotaWindowStart,
} from '@otwld/ts-ai';
import { AiException } from '../exceptions/ai.exception';
import { AiQuotaReservation, AiQuotaReservationRequest, AiQuotaStorage } from './ai-quota-storage';
import { AiQuotaBucketDocument, AiQuotaBucketRecord } from './mongoose-ai-quota.schema';

/** Mongoose-backed quota storage with atomic bucket reservations. */
@Injectable()
export class MongooseAiQuotaStorage implements AiQuotaStorage {
  /**
   * Create Mongoose-backed AI quota storage.
   *
   * @param buckets - Mongoose model storing quota bucket counters.
   */
  constructor(@InjectModel(AiQuotaBucketRecord.name) private readonly buckets: Model<AiQuotaBucketDocument>) {}

  /** Read usage buckets for a subject across the supplied quota limits. */
  async getUsage(subject: AiQuotaSubject, limits: AiQuotaLimit[], now: Date): Promise<AiQuotaUsageBucket[]> {
    return Promise.all(
      limits.map(async (limit) => {
        const windowKey = createAiQuotaWindowKey(limit.window, now);
        const bucket = await this.buckets.findOne({ subjectType: subject.type, subjectId: subject.id, windowKey }).lean().exec();
        const usedTokens = bucket?.usedTokens ?? 0;
        const reservedTokens = bucket?.reservedTokens ?? 0;
        const remainingTokens = Math.max(limit.maxTokens - usedTokens - reservedTokens, 0);

        return {
          window: limit.window,
          limitTokens: limit.maxTokens,
          usedTokens,
          reservedTokens,
          remainingTokens,
          resetAt: getAiQuotaWindowReset(limit.window, now).toISOString(),
          exceeded: remainingTokens === 0,
        };
      }),
    );
  }

  /** Atomically reserve tokens in every configured bucket for a request. */
  async reserve(request: AiQuotaReservationRequest): Promise<AiQuotaReservation> {
    const entries: AiQuotaReservation['entries'] = [];

    for (const limit of request.limits) {
      const windowStartAt = getAiQuotaWindowStart(limit.window, request.now);
      const resetAt = getAiQuotaWindowReset(limit.window, request.now);
      const windowKey = createAiQuotaWindowKey(limit.window, request.now);

      await this.buckets.updateOne(
        { subjectType: request.subject.type, subjectId: request.subject.id, windowKey },
        {
          $setOnInsert: {
            subjectType: request.subject.type,
            subjectId: request.subject.id,
            windowKey,
            windowUnit: limit.window.unit,
            windowSize: limit.window.size,
            windowStartAt,
            resetAt,
            usedTokens: 0,
            reservedTokens: 0,
          },
        },
        { upsert: true },
      );

      const updated = await this.buckets
        .findOneAndUpdate(
          {
            subjectType: request.subject.type,
            subjectId: request.subject.id,
            windowKey,
            $expr: { $lte: [{ $add: ['$usedTokens', '$reservedTokens', request.requestedTokens] }, limit.maxTokens] },
          },
          { $inc: { reservedTokens: request.requestedTokens } },
          { returnDocument: 'after' },
        )
        .lean()
        .exec();

      if (!updated) {
        await this.release({ id: randomUUID(), subject: request.subject, requestedTokens: request.requestedTokens, entries });
        const bucket = (await this.getUsage(request.subject, [limit], request.now))[0];
        throw AiException.quotaExceeded(bucket, request.requestedTokens);
      }

      entries.push({ windowKey, reservedTokens: request.requestedTokens, limit });
    }

    return { id: randomUUID(), subject: request.subject, requestedTokens: request.requestedTokens, entries };
  }

  /** Move reserved tokens into used-token counters after provider usage resolves. */
  async commit(reservation: AiQuotaReservation, usage: AiUsage): Promise<void> {
    const totalTokens = usage.totalTokens ?? (usage.inputTokens ?? 0) + (usage.outputTokens ?? 0);
    await Promise.all(
      reservation.entries.map((entry) =>
        this.buckets
          .updateOne(
            { subjectType: reservation.subject.type, subjectId: reservation.subject.id, windowKey: entry.windowKey },
            { $inc: { reservedTokens: -entry.reservedTokens, usedTokens: totalTokens } },
          )
          .exec(),
      ),
    );
  }

  /** Release reserved tokens when a provider call fails or usage is unavailable. */
  async release(reservation: AiQuotaReservation): Promise<void> {
    await Promise.all(
      reservation.entries.map((entry) =>
        this.buckets
          .updateOne(
            { subjectType: reservation.subject.type, subjectId: reservation.subject.id, windowKey: entry.windowKey },
            { $inc: { reservedTokens: -entry.reservedTokens } },
          )
          .exec(),
      ),
    );
  }
}
