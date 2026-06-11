import { signal } from '@angular/core';
import { type Meta, moduleMetadata, type StoryObj } from '@storybook/angular';
import { expect, fn, waitFor } from 'storybook/test';
import { UploadStatus } from '@otwld/ts-storage';
import type { DropZoneOptions } from '../models/upload-options';
import type { UploadTask } from '../models/upload-task';
import { StorageService } from '../services/storage.service';
import { StoDropZoneDirective } from './sto-drop-zone.directive';

function createUploadTask(file: File): UploadTask {
  return {
    bytesUploaded: signal(0),
    error: signal(null),
    file,
    id: `upload-${file.name}`,
    nextRetryIn: signal(0),
    progress: signal(0),
    retryAttempt: signal(0),
    status: signal(UploadStatus.Pending),
    storageFile: signal(null),
  };
}

const upload = fn((file: File) => createUploadTask(file));
const filesDropped = fn();

const meta: Meta<StoDropZoneDirective> = {
  argTypes: {
    dropZoneOptions: {
      control: 'object',
      description: 'Drop-zone and upload options.',
      table: { category: 'Inputs' },
    },
    filesDropped: {
      action: 'filesDropped',
      description: 'Emits selected files when a drop event is accepted.',
      table: { category: 'Outputs' },
    },
  },
  args: {
    dropZoneOptions: {
      autoStart: false,
      metadata: {
        source: 'candidate-resume',
      },
      multiple: true,
    } satisfies DropZoneOptions,
    filesDropped,
  },
  component: StoDropZoneDirective,
  decorators: [
    moduleMetadata({
      imports: [StoDropZoneDirective],
      providers: [
        {
          provide: StorageService,
          useValue: {
            upload,
          },
        },
      ],
    }),
  ],
  title: 'storage/ng/sto-drop-zone',
};

export default meta;

type Story = StoryObj<StoDropZoneDirective>;

/** File upload host configured for candidate resume intake. */
export const Default: Story = {
  render: (args) => ({
    props: args,
    template: `<div
      style="border: 1px dashed #94a3b8; border-radius: 8px; padding: 1rem;"
      [stoDropZone]="dropZoneOptions"
      (filesDropped)="filesDropped($event)"
    >
      Drop candidate resumes here
    </div>`,
  }),
  play: async ({ canvas, step }) => {
    await step('emit dropped files and create upload tasks', async () => {
      const dropZone = canvas.getByText(/drop candidate resumes here/i);
      const resume = new File(['candidate resume'], 'ada-lovelace-resume.pdf', {
        type: 'application/pdf',
      });
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(resume);
      upload.mockClear();
      filesDropped.mockClear();

      dropZone.dispatchEvent(
        new DragEvent('dragover', {
          bubbles: true,
          cancelable: true,
          dataTransfer,
        }),
      );
      await waitFor(() => expect(dropZone).toHaveClass('sto-dragover'));

      dropZone.dispatchEvent(
        new DragEvent('drop', {
          bubbles: true,
          cancelable: true,
          dataTransfer,
        }),
      );

      await expect(filesDropped).toHaveBeenCalledWith([resume]);
      await expect(upload).toHaveBeenCalledWith(resume, {
        autoStart: false,
        metadata: {
          source: 'candidate-resume',
        },
        multiple: true,
      });
      await waitFor(() => expect(dropZone).not.toHaveClass('sto-dragover'));
    });
  },
};
