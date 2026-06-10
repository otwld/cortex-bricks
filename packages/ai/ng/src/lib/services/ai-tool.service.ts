import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { AiToolDescriptor } from '@otwld/ts-ai';
import { firstValueFrom } from 'rxjs';
import { AI_CONFIG } from '../tokens/ai-config.token';

/** Angular client for AI tool descriptors exposed by the backend. */
@Injectable({ providedIn: 'root' })
export class AiToolService {
  private readonly config = inject(AI_CONFIG);
  private readonly http = inject(HttpClient);

  /** Fetch the tools currently available to AI chat and completion calls. */
  list(): Promise<AiToolDescriptor[]> {
    return firstValueFrom(this.http.get<AiToolDescriptor[]>(`${this.config.apiBaseUrl}/tools`));
  }
}
