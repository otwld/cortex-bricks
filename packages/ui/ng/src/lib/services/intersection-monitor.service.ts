import { Injectable } from '@angular/core';

/**
 * Tracks whether caller-provided IDs have intersected at least once.
 */
@Injectable()
export class IntersectionMonitorService {
  private readonly intersected = new Set<unknown>();

  /**
   * Records the ID when the first observer entry is intersecting.
   */
  onIntersect(event: IntersectionObserverEntry[], id: unknown) {
    const [entry] = event;
    if (entry.isIntersecting && !this.intersected.has(id))
      this.intersected.add(id);
  }

  /**
   * Returns whether the ID has intersected previously.
   */
  hasIntersected(id: unknown) {
    return this.intersected.has(id);
  }
}
