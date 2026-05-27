import type { Mocked } from 'vitest';
import { HttpException, HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Request } from 'express';
import { AiErrorCode } from '@otwld/ts-ai';
import { AI_ENDPOINT_OPTIONS } from '../config/ai-module-options';
import { AiQuotaService } from '../quota/ai-quota.service';
import { AiService } from '../services/ai.service';
import { AiController } from './ai.controller';

describe('AiController', () => {
  let controller: AiController;
  let moduleRef: TestingModule;
  let service: Mocked<
    Pick<AiService, 'listModels' | 'listTools' | 'generateObject'>
  >;
  let quota: Mocked<
    Pick<
      AiQuotaService,
      | 'reserveForRequest'
      | 'commit'
      | 'release'
      | 'commitWhenUsageSettles'
      | 'snapshotForRequest'
    >
  >;

  beforeEach(async () => {
    service = {
      listModels: vi
        .fn()
        .mockReturnValue([
          {
            alias: 'chat',
            providerModel: 'openai:gpt-5.4',
            capabilities: ['chat'],
          },
        ]),
      listTools: vi
        .fn()
        .mockReturnValue([
          {
            name: 'echo',
            description: 'Echo input',
            inputSchema: { type: 'object' },
          },
        ]),
      generateObject: vi
        .fn()
        .mockResolvedValue({
          object: { title: 'Demo' },
          usage: { totalTokens: 12 },
        }),
    };
    quota = {
      reserveForRequest: vi.fn().mockResolvedValue(null),
      commit: vi.fn().mockResolvedValue(undefined),
      release: vi.fn().mockResolvedValue(undefined),
      commitWhenUsageSettles: vi.fn(),
      snapshotForRequest: vi.fn(),
    };

    moduleRef = await Test.createTestingModule({
      controllers: [AiController],
      providers: [
        { provide: AiService, useValue: service },
        { provide: AiQuotaService, useValue: quota },
        {
          provide: AI_ENDPOINT_OPTIONS,
          useValue: {
            limits: {
              maxMessageContentLength: 100,
              maxMessages: 5,
              maxOutputTokens: 100,
              maxPromptLength: 100,
            },
          },
        },
      ],
    }).compile();

    controller = moduleRef.get(AiController);
  });

  it('returns configured models', () => {
    expect(controller.models()).toEqual([
      {
        alias: 'chat',
        providerModel: 'openai:gpt-5.4',
        capabilities: ['chat'],
      },
    ]);
  });

  it('returns tool descriptors', () => {
    expect(controller.tools()).toEqual([
      {
        name: 'echo',
        description: 'Echo input',
        inputSchema: { type: 'object' },
      },
    ]);
  });

  it('returns generated objects', async () => {
    const request = { user: { id: 'user-1' } } as unknown as Request;
    const result = await controller.object(
      'summary',
      { prompt: 'Summarize' },
      request,
    );

    expect(result).toEqual({
      object: { title: 'Demo' },
      usage: { totalTokens: 12 },
    });
    expect(service.generateObject).toHaveBeenCalledWith('summary', {
      prompt: 'Summarize',
    });
    expect(quota.reserveForRequest).toHaveBeenCalledWith(request, 'object', {
      prompt: 'Summarize',
    });
    expect(quota.commit).toHaveBeenCalledWith(null, { totalTokens: 12 });
  });

  it('returns the current quota usage snapshot', async () => {
    quota.snapshotForRequest.mockResolvedValueOnce({
      subject: { type: 'user', id: 'user-1', roles: ['member'] },
      maxPromptTokens: 8_000,
      buckets: [],
    });
    const request = { user: { id: 'user-1' } } as unknown as Request;

    await expect(controller.usage(request)).resolves.toEqual({
      subject: { type: 'user', id: 'user-1', roles: ['member'] },
      maxPromptTokens: 8_000,
      buckets: [],
    });
    expect(quota.snapshotForRequest).toHaveBeenCalledWith(request);
  });

  it('maps invalid request bodies to typed HTTP validation errors', async () => {
    expect.assertions(4);

    try {
      await controller.object('summary', { prompt: '' }, {
        user: { id: 'user-1' },
      } as unknown as Request);
    } catch (error) {
      expect(error).toBeInstanceOf(HttpException);
      expect((error as HttpException).getStatus()).toBe(HttpStatus.BAD_REQUEST);
      expect((error as HttpException).getResponse()).toEqual(
        expect.objectContaining({ code: AiErrorCode.VALIDATION_FAILED }),
      );
      expect(service.generateObject).not.toHaveBeenCalled();
    }
  });
});
