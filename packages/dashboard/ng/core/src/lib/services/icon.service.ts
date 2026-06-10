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
 * Loads and stores icon metadata for dashboard icon pickers.
 */
@Injectable()
export class IconService {
  private readonly http = inject(HttpClient);

  /**
   * Icon definitions returned by the demo icon data endpoint.
   */
  icons: IconDefinition[] = [];

  /**
   * Icon currently selected by a consumer of the picker data.
   */
  selectedIcon: IconDefinition | null = null;

  /**
   * Demo data URL used to load icon definitions.
   */
  apiUrl = 'public/demo/data/icons.json';

  /**
   * Loads icon definitions and caches them on the service.
   *
   * @returns Observable that emits the loaded icon definitions.
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
