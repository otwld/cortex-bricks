import { inject, Pipe, PipeTransform } from '@angular/core';
import { Observable } from 'rxjs';
import { SignedUrlCacheService } from '../services/signed-url-cache.service';

/**
 * Provides sto signed url pipe behavior.
 */
@Pipe({ name: 'stoSignedUrl', pure: false })
/** Angular pipe that resolves and caches signed read URLs for storage keys. */
export class StoSignedUrlPipe implements PipeTransform {
  private readonly cache = inject(SignedUrlCacheService);

  /** Return an observable signed URL for a key and optional TTL. */
  /**
   * Runs transform.
   *
   * @param key - key value.
   *
   * @param expiresIn - expires in value.
   *
   * @returns The sto signed url pipe transform result.
   */
  transform(key: string, expiresIn?: number): Observable<string> {
    return this.cache.get(key, expiresIn);
  }
}
