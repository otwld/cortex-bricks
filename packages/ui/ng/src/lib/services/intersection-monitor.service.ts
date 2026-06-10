import { Injectable } from '@angular/core';

@Injectable()
export class IntersectionMonitorService {
  private readonly intersected = new Set<unknown>();

  onIntersect(event: IntersectionObserverEntry[], id: unknown) {
    const [entry] = event;
    if (entry.isIntersecting && !this.intersected.has(id))
      this.intersected.add(id);
  }

  hasIntersected(id: unknown) {
    return this.intersected.has(id);
  }
}
