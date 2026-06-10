import { inject, Pipe, PipeTransform } from '@angular/core';
import { Observable } from 'rxjs';
import { SignedUrlCacheService } from '../services/signed-url-cache.service';

/** Angular pipe that resolves and caches signed read URLs for storage keys. */
@Pipe({ name: 'stoSignedUrl', pure: false })
export class StoSignedUrlPipe implements PipeTransform {
  private readonly cache = inject(SignedUrlCacheService);

  /** Returns an observable signed URL for a key and optional TTL. */
  transform(key: string, expiresIn?: number): Observable<string> {
    return this.cache.get(key, expiresIn);
  }
}
