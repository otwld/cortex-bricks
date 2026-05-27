import { Injectable } from '@nestjs/common';
import { WsScalingAdapter } from './ws-scaling-adapter';

/**
 * No-op scaling adapter for single-process deployments.
 */
@Injectable()
export class NoopScalingAdapter extends WsScalingAdapter {
  /** No-op. */
  public async install(): Promise<void> {
    return Promise.resolve();
  }

  /** No-op. */
  public async dispose(): Promise<void> {
    return Promise.resolve();
  }
}
