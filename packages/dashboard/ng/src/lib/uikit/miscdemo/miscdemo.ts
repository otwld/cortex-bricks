import { Component, OnDestroy, OnInit } from '@angular/core';
import { AvatarModule } from 'primeng/avatar';
import { AvatarGroupModule } from 'primeng/avatargroup';
import { BadgeModule } from 'primeng/badge';
import { ButtonModule } from 'primeng/button';
import { ChipModule } from 'primeng/chip';
import { OverlayBadgeModule } from 'primeng/overlaybadge';
import { ProgressBarModule } from 'primeng/progressbar';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { ScrollTopModule } from 'primeng/scrolltop';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { MeterGroupModule } from 'primeng/metergroup';
import { Card } from 'primeng/card';

interface MeterGroupItem {
  label: string;
  color: string;
  value: number;
}

/**
 * Demonstrates PrimeNG status, avatar, scrolling, skeleton, and meter components.
 */
@Component({
  selector: 'app-misc-demo',
  imports: [
    ProgressBarModule,
    BadgeModule,
    AvatarModule,
    ScrollPanelModule,
    TagModule,
    ChipModule,
    ButtonModule,
    SkeletonModule,
    AvatarGroupModule,
    ScrollTopModule,
    OverlayBadgeModule,
    MeterGroupModule,
    Card,
  ],
  templateUrl: './miscdemo.html',
})
export class MiscDemo implements OnInit, OnDestroy {
  protected value = 0;

  private interval: ReturnType<typeof setInterval> | null = null;

  protected readonly meterGroupValue: MeterGroupItem[] = [
    { label: 'Apps', color: '#34d399', value: 16 },
    { label: 'Messages', color: '#fbbf24', value: 8 },
    { label: 'Media', color: '#60a5fa', value: 24 },
    { label: 'System', color: '#c084fc', value: 10 },
  ];

  /**
   * Starts the simulated progress bar updates.
   */
  ngOnInit(): void {
    this.interval = setInterval(() => {
      this.value = this.value + Math.floor(Math.random() * 10) + 1;
      if (this.value >= 100) {
        this.value = 100;
        this.clearProgressInterval();
      }
    }, 2000);
  }

  /**
   * Stops the simulated progress bar updates.
   */
  ngOnDestroy(): void {
    this.clearProgressInterval();
  }

  private clearProgressInterval(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }
}
