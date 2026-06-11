import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit, inject, input, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

/** Candidate row returned by the Storybook recruitment search API mock. */
export interface CandidateSearchRow {
  id: string;
  fullName: string;
  email: string;
  companyId: string;
  companyName: string;
  status: 'active' | 'inactive' | 'on-hold';
  skills: string[];
}

/** Paginated candidate search response consumed by the example component. */
export interface CandidateSearchResponse {
  items: CandidateSearchRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
}

/**
 * Standalone Angular example that demonstrates HttpClient-backed Storybook
 * stories with deterministic MSW search responses.
 */
@Component({
  selector: 'lib-http-client-search-example',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './http-client-search-example.component.html',
})
export class HttpClientSearchExampleComponent implements OnInit {
  /**
   * Search API endpoint used by the example component.
   */
  readonly apiUrl = input('/api/recruitment/candidates/search');

  /**
   * Query executed when the example initializes.
   */
  readonly initialQuery = input('engineer');

  /**
   * Whether the example is waiting for an HTTP response.
   */
  readonly isLoading = signal(false);

  /**
   * Visible error message from the latest failed search.
   */
  readonly error = signal<string | null>(null);

  /**
   * Last candidate search response returned by the API.
   */
  readonly response = signal<CandidateSearchResponse | null>(null);

  /**
   * Query currently represented by the visible response state.
   */
  readonly activeQuery = signal('');

  private readonly httpClient = inject(HttpClient);

  async ngOnInit(): Promise<void> {
    await this.runSearch(this.initialQuery());
  }

  /**
   * Executes a candidate search request and updates loading, error, and response state.
   */
  async runSearch(query: string): Promise<void> {
    this.activeQuery.set(query);
    this.error.set(null);
    this.isLoading.set(true);

    try {
      const requestUrl = `${this.apiUrl()}?query=${encodeURIComponent(
        query
      )}&page=1&pageSize=6&sortBy=fullName&sortDirection=asc`;
      const payload = await firstValueFrom(
        this.httpClient.get<CandidateSearchResponse>(requestUrl)
      );

      this.response.set(payload);
    } catch {
      this.response.set(null);
      this.error.set('Unable to load candidates. The mock API returned an error.');
    } finally {
      this.isLoading.set(false);
    }
  }
}
