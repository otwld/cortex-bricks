import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { AiQuotaUsageSnapshot } from '@otwld/ts-ai';
import { firstValueFrom } from 'rxjs';
import { AI_CONFIG } from '../tokens/ai-config.token';

/** Angular client for the current user's AI quota usage. */
@Injectable({ providedIn: 'root' })
export class AiUsageService {
  private readonly config = inject(AI_CONFIG);
  private readonly http = inject(HttpClient);

  /** Loads the current user's effective AI quota usage snapshot. */
  snapshot(): Promise<AiQuotaUsageSnapshot> {
    return firstValueFrom(this.http.get<AiQuotaUsageSnapshot>(`${this.config.apiBaseUrl}/usage`));
  }
}
