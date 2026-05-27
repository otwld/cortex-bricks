import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable, of, shareReplay, tap } from 'rxjs';
import { STORAGE_CONFIG } from '../tokens/storage-config.token';

interface CacheEntry {
  url?: string;
  expiresAt?: number;
  pending?: Observable<string>;
}

/**
 * Provides signed url cache service behavior.
 */
@Injectable({ providedIn: 'root' })
/** Caches signed read URLs until their configured refresh threshold. */
export class SignedUrlCacheService {
  private readonly config = inject(STORAGE_CONFIG);
  private readonly http = inject(HttpClient);
  private readonly cache = new Map<string, CacheEntry>();

  /** Return a cached or freshly requested signed URL for a storage key. */
  /**
   * Runs get.
   *
   * @param key - key value.
   *
   * @param ttl - ttl value.
   *
   * @returns The signed url cache service get result.
   */
  get(key: string, ttl = this.config.defaultExpiresIn): Observable<string> {
    const cacheKey = `${key}:${ttl}`;
    const cached = this.cache.get(cacheKey);
    const refreshAt = Date.now() + this.config.signedUrlRefreshThresholdMs;
    if (cached?.url && cached.expiresAt && cached.expiresAt > refreshAt) return of(cached.url);
    if (cached?.pending) return cached.pending;

    const pending = this.http.post<string | { url: string; expiresAt?: number }>(this.config.signedUrlEndpoint, { key, expiresIn: ttl }).pipe(
      tap((response) => {
        const url = typeof response === 'string' ? response : response.url;
        const expiresAt = typeof response === 'string' || !response.expiresAt ? Date.now() + ttl * 1000 : normalizeExpiresAt(response.expiresAt);
        this.cache.set(cacheKey, { url, expiresAt });
      }),
      map((response) => (typeof response === 'string' ? response : response.url)),
      shareReplay({ bufferSize: 1, refCount: false }),
    );

    this.cache.set(cacheKey, { pending });
    return pending;
  }
}

function normalizeExpiresAt(value: number): number {
  return value < 10_000_000_000 ? value * 1000 : value;
}
