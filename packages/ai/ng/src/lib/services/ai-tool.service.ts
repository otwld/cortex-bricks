import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { AiToolDescriptor } from '@otwld/ts-ai';
import { firstValueFrom } from 'rxjs';
import { AI_CONFIG } from '../tokens/ai-config.token';

/**
 * Provides ai tool service behavior.
 */
@Injectable({ providedIn: 'root' })
export class AiToolService {
  private readonly config = inject(AI_CONFIG);
  private readonly http = inject(HttpClient);

  /**
   * Runs list.
   *
   * @returns The ai tool service list result.
   */
  list(): Promise<AiToolDescriptor[]> {
    return firstValueFrom(this.http.get<AiToolDescriptor[]>(`${this.config.apiBaseUrl}/tools`));
  }
}
