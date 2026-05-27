import { Component, PLATFORM_ID, signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideStorage } from '../provide-storage';
import { StoDropZoneDirective } from './sto-drop-zone.directive';

@Component({
  template: `<div [stoDropZone]="{ autoStart: false }" (filesDropped)="dropped.set($event)"></div>`,
  imports: [StoDropZoneDirective],
})
class HostComponent {
  dropped = signal<File[]>([]);
}

describe('StoDropZoneDirective', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideStorage({ tusEndpoint: '/x', signedUrlEndpoint: '/y' }),
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    }),
  );

  it('emits filesDropped on drop event', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const div = fixture.nativeElement.querySelector('div') as HTMLDivElement;
    const file = new File([new Uint8Array([1])], 'a.bin');
    const event = new Event('drop') as DragEvent;
    Object.defineProperty(event, 'dataTransfer', { value: { files: [file] } });

    div.dispatchEvent(event);
    fixture.detectChanges();

    expect(fixture.componentInstance.dropped().length).toBe(1);
  });
});
