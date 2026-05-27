import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map } from 'rxjs/operators';

interface IconDefinition {
  readonly [key: string]: unknown;
}

interface IconResponse {
  readonly icons: IconDefinition[];
}

/**
 * Provides icon service behavior.
 */
@Injectable()
export class IconService {
  private readonly http = inject(HttpClient);

  icons: IconDefinition[] = [];

  selectedIcon: IconDefinition | null = null;

  apiUrl = 'public/demo/data/icons.json';

  /**
   * Runs get icons.
   *
   * @returns The icon service get icons result.
   */
  getIcons() {
    return this.http.get<IconResponse>(this.apiUrl).pipe(
      map((response) => {
        this.icons = response.icons;
        return this.icons;
      }),
    );
  }
}
