import { Directive, inject, input, output, signal } from '@angular/core';
import { DropZoneOptions } from '../models/upload-options';
import { StorageService } from '../services/storage.service';

/** Drop-zone directive that emits dropped files and creates upload tasks. */
@Directive({
  selector: '[stoDropZone]',
  host: {
    '(dragover)': 'onDragOver($event)',
    '(dragleave)': 'onDragLeave()',
    '(drop)': 'onDrop($event)',
    '[class.sto-dragover]': 'isDragging()',
  },
})
export class StoDropZoneDirective {
  /** Drop-zone and upload options read from the `stoDropZone` input. */
  readonly options = input<DropZoneOptions>({}, { alias: 'stoDropZone' });
  /** Emits selected files when a drop event is accepted. */
  readonly filesDropped = output<File[]>();

  private readonly storage = inject(StorageService);
  private readonly _isDragging = signal(false);
  /** Read-only signal indicating whether a drag is active over the host. */
  readonly isDragging = this._isDragging.asReadonly();

  /** Marks the zone active for valid drag-over events. */
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    if (!this.options().disabled) this._isDragging.set(true);
  }

  /** Clear the active drag state. */
  onDragLeave(): void {
    this._isDragging.set(false);
  }

  /** Accepts dropped files, emits them, and creates upload tasks. */
  onDrop(event: DragEvent): void {
    event.preventDefault();
    this._isDragging.set(false);
    if (this.options().disabled) return;
    const files = Array.from(event.dataTransfer?.files ?? []);
    const selected = this.options().multiple === false ? files.slice(0, 1) : files;
    this.filesDropped.emit(selected);
    selected.forEach((file) => this.storage.upload(file, this.options()));
  }
}
