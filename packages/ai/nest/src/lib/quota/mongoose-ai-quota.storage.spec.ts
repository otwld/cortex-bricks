import { Test, TestingModule } from '@nestjs/testing';
import { getConnectionToken, MongooseModule } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Connection } from 'mongoose';
import { AiException } from '../exceptions/ai.exception';
import {
  AiQuotaBucketRecord,
  AiQuotaBucketSchema,
} from './mongoose-ai-quota.schema';
import { MongooseAiQuotaStorage } from './mongoose-ai-quota.storage';

describe(MongooseAiQuotaStorage.name, () => {
  let mongo: MongoMemoryServer;
  let moduleRef: TestingModule;
  let connection: Connection;
  let storage: MongooseAiQuotaStorage;

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    moduleRef = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(mongo.getUri()),
        MongooseModule.forFeature([
          { name: AiQuotaBucketRecord.name, schema: AiQuotaBucketSchema },
        ]),
      ],
      providers: [MongooseAiQuotaStorage],
    }).compile();

    connection = moduleRef.get(getConnectionToken());
    storage = moduleRef.get(MongooseAiQuotaStorage);
  });

  afterAll(async () => {
    await moduleRef.close();
    await connection.close();
    await mongo.stop();
  });

  beforeEach(async () => {
    await connection.dropDatabase();
  });

  it('reserves tokens and exposes reserved usage in snapshots', async () => {
    const now = new Date('2026-05-08T07:15:00.000Z');
    const reservation = await storage.reserve({
      subject: { type: 'user', id: 'user-1', roles: ['member'] },
      requestedTokens: 5_000,
      limits: [{ window: { unit: 'hour', size: 1 }, maxTokens: 10_000 }],
      now,
    });

    const buckets = await storage.getUsage(
      { type: 'user', id: 'user-1', roles: ['member'] },
      [{ window: { unit: 'hour', size: 1 }, maxTokens: 10_000 }],
      now,
    );

    expect(reservation.entries).toHaveLength(1);
    expect(buckets[0]).toEqual(
      expect.objectContaining({
        usedTokens: 0,
        reservedTokens: 5_000,
        remainingTokens: 5_000,
      }),
    );
  });

  it('rejects reservations that exceed the configured bucket limit', async () => {
    const now = new Date('2026-05-08T07:15:00.000Z');

    await storage.reserve({
      subject: { type: 'user', id: 'user-1', roles: ['member'] },
      requestedTokens: 8_000,
      limits: [{ window: { unit: 'hour', size: 1 }, maxTokens: 10_000 }],
      now,
    });

    await expect(
      storage.reserve({
        subject: { type: 'user', id: 'user-1', roles: ['member'] },
        requestedTokens: 3_000,
        limits: [{ window: { unit: 'hour', size: 1 }, maxTokens: 10_000 }],
        now,
      }),
    ).rejects.toBeInstanceOf(AiException);
  });

  it('commits actual usage and releases unused reservation tokens', async () => {
    const now = new Date('2026-05-08T07:15:00.000Z');
    const subject = { type: 'user' as const, id: 'user-1', roles: ['member'] };
    const limits = [
      { window: { unit: 'hour' as const, size: 1 }, maxTokens: 10_000 },
    ];
    const reservation = await storage.reserve({
      subject,
      requestedTokens: 6_000,
      limits,
      now,
    });

    await storage.commit(reservation, {
      inputTokens: 1_000,
      outputTokens: 2_000,
      totalTokens: 3_000,
    });

    const buckets = await storage.getUsage(subject, limits, now);
    expect(buckets[0]).toEqual(
      expect.objectContaining({
        usedTokens: 3_000,
        reservedTokens: 0,
        remainingTokens: 7_000,
      }),
    );
  });

  it('releases failed reservations', async () => {
    const now = new Date('2026-05-08T07:15:00.000Z');
    const subject = { type: 'user' as const, id: 'user-1', roles: ['member'] };
    const limits = [
      { window: { unit: 'hour' as const, size: 1 }, maxTokens: 10_000 },
    ];
    const reservation = await storage.reserve({
      subject,
      requestedTokens: 6_000,
      limits,
      now,
    });

    await storage.release(reservation);

    const buckets = await storage.getUsage(subject, limits, now);
    expect(buckets[0]).toEqual(
      expect.objectContaining({
        usedTokens: 0,
        reservedTokens: 0,
        remainingTokens: 10_000,
      }),
    );
  });
});
