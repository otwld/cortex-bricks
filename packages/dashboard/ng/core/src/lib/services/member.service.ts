import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Member } from '../types/member';

interface MemberResponse {
  readonly data: Member[];
}

/** Loads member fixtures for dashboard people and team demos. */
@Injectable({
  providedIn: 'root',
})
export class MemberService {
  private readonly http = inject(HttpClient);

  /** Load member fixture data from the demo JSON asset. */
  getMembers() {
    return this.http
      .get<MemberResponse>('/demo/data/members.json')
      .toPromise()
      .then((res) => res?.data ?? [])
      .then((data) => data);
  }
}
