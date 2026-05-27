import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { AiModelAlias } from '@otwld/ts-ai';
import { firstValueFrom } from 'rxjs';
import { AI_CONFIG } from '../tokens/ai-config.token';

/**
 * Provides ai models service behavior.
 */
@Injectable({ providedIn: 'root' })
export class AiModelsService {
  private readonly config = inject(AI_CONFIG);
  private readonly http = inject(HttpClient);

  /**
   * Runs list.
   *
   * @returns The ai models service list result.
   */
  list(): Promise<AiModelAlias[]> {
    return firstValueFrom(this.http.get<AiModelAlias[]>(`${this.config.apiBaseUrl}/models`));
  }
}
