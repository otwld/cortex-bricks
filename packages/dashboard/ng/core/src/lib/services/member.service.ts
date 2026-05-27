import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Member } from '../types/member';

interface MemberResponse {
  readonly data: Member[];
}

/**
 * Provides member service behavior.
 */
@Injectable({
  providedIn: 'root',
})
export class MemberService {
  private readonly http = inject(HttpClient);

  /**
   * Runs get members.
   *
   * @returns The member service get members result.
   */
  getMembers() {
    return this.http
      .get<MemberResponse>('/demo/data/members.json')
      .toPromise()
      .then((res) => res?.data ?? [])
      .then((data) => data);
  }
}
