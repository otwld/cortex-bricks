import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit, inject, input, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

/**
 * Internal contract for Candidate Search Item.
 */
export interface CandidateSearchItem {
  id: string;
  fullName: string;
  email: string;
  companyId: string;
  companyName: string;
  status: 'active' | 'inactive' | 'on-hold';
  skills: string[];
}

/**
 * Internal contract for Candidate Search Response.
 */
export interface CandidateSearchResponse {
  items: CandidateSearchItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
}

/**
 * Internal class for Http Client Search Example Component.
 */
@Component({
  selector: 'lib-http-client-search-example',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './http-client-search-example.component.html',
})
export class HttpClientSearchExampleComponent implements OnInit {
  readonly apiUrl = input('/api/recruitment/candidates/search');
  readonly initialQuery = input('engineer');

  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly response = signal<CandidateSearchResponse | null>(null);
  readonly activeQuery = signal('');

  private readonly httpClient = inject(HttpClient);

  async ngOnInit(): Promise<void> {
    await this.runSearch(this.initialQuery());
  }

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
