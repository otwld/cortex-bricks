import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { AiObjectRequest } from '@otwld/ts-ai';
import { firstValueFrom, map } from 'rxjs';
import { AI_CONFIG } from '../tokens/ai-config.token';

/**
 * Provides ai object service behavior.
 */
@Injectable({ providedIn: 'root' })
export class AiObjectService {
  private readonly config = inject(AI_CONFIG);
  private readonly http = inject(HttpClient);

  /**
   * Runs generate.
   *
   * @param schemaKey - schema key value.
   *
   * @param request - request value.
   *
   * @returns The ai object service generate result.
   */
  generate<TObject>(schemaKey: string, request: AiObjectRequest): Promise<TObject> {
    return firstValueFrom(
      this.http
        .post<{ object: TObject }>(`${this.config.apiBaseUrl}/object/${encodeURIComponent(schemaKey)}`, request)
        .pipe(map((response) => response.object)),
    );
  }
}
