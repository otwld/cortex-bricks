import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { of } from 'rxjs';
import { AI_ENDPOINT_OPTIONS } from '../config/ai-module-options';
import { AiEndpointGuard } from './ai-endpoint.guard';

describe(AiEndpointGuard.name, () => {
  @Injectable()
  class AllowGuard implements CanActivate {
    canActivate = vi.fn(() => true);
  }

  @Injectable()
  class ObservableDenyGuard implements CanActivate {
    canActivate = vi.fn(() => of(false));
  }

  it('allows requests when no endpoint guards are configured', async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        AiEndpointGuard,
        {
          provide: AI_ENDPOINT_OPTIONS,
          useValue: { guards: [] },
        },
      ],
    }).compile();

    await expect(
      moduleRef.get(AiEndpointGuard).canActivate({} as ExecutionContext),
    ).resolves.toBe(true);
  });

  it('delegates to configured guards and stops on denial', async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        AiEndpointGuard,
        AllowGuard,
        ObservableDenyGuard,
        {
          provide: AI_ENDPOINT_OPTIONS,
          useValue: { guards: [AllowGuard, ObservableDenyGuard] },
        },
      ],
    }).compile();

    await expect(
      moduleRef.get(AiEndpointGuard).canActivate({} as ExecutionContext),
    ).resolves.toBe(false);
    expect(moduleRef.get(AllowGuard).canActivate).toHaveBeenCalled();
    expect(moduleRef.get(ObservableDenyGuard).canActivate).toHaveBeenCalled();
  });
});
