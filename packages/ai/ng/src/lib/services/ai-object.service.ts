import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { AiObjectRequest } from '@otwld/ts-ai';
import { firstValueFrom, map } from 'rxjs';
import { AI_CONFIG } from '../tokens/ai-config.token';

/** Angular client for schema-backed AI object generation. */
@Injectable({ providedIn: 'root' })
export class AiObjectService {
  private readonly config = inject(AI_CONFIG);
  private readonly http = inject(HttpClient);

  /** Generate a typed object with the registered backend schema key. */
  generate<TObject>(schemaKey: string, request: AiObjectRequest): Promise<TObject> {
    return firstValueFrom(
      this.http
        .post<{ object: TObject }>(`${this.config.apiBaseUrl}/object/${encodeURIComponent(schemaKey)}`, request)
        .pipe(map((response) => response.object)),
    );
  }
}
