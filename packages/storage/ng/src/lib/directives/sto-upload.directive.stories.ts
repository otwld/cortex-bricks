import { signal } from '@angular/core';
import { type Meta, moduleMetadata, type StoryObj } from '@storybook/angular';
import { expect, fn } from 'storybook/test';
import { UploadStatus } from '@otwld/ts-storage';
import type { UploadOptions } from '../models/upload-options';
import type { UploadTask } from '../models/upload-task';
import { StorageService } from '../services/storage.service';
import { StoUploadDirective } from './sto-upload.directive';

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
const uploadStart = fn();
const uploadComplete = fn();
const uploadError = fn();

const meta: Meta<StoUploadDirective> = {
  argTypes: {
    uploadComplete: {
      action: 'uploadComplete',
      description: 'Emitted when an upload task completes.',
      table: { category: 'Outputs' },
    },
    uploadError: {
      action: 'uploadError',
      description: 'Emitted when an upload task fails.',
      table: { category: 'Outputs' },
    },
    uploadOptions: {
      control: 'object',
      description: 'Options supplied to the storage upload service.',
      table: { category: 'Inputs' },
    },
    uploadStart: {
      action: 'uploadStart',
      description: 'Emitted when an upload task is created.',
      table: { category: 'Outputs' },
    },
  },
  args: {
    uploadComplete,
    uploadError,
    uploadOptions: {
      autoStart: false,
      metadata: {
        source: 'candidate-resume',
      },
    } satisfies UploadOptions,
    uploadStart,
  },
  component: StoUploadDirective,
  decorators: [
    moduleMetadata({
      imports: [StoUploadDirective],
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
  title: 'storage/ng/sto-upload',
};

export default meta;

type Story = StoryObj<StoUploadDirective>;

/** File upload host configured for candidate resume intake. */
export const Default: Story = {
  render: (args) => ({
    props: args,
    template: `<label>
      Candidate resume
      <input type="file" [stoUpload]="uploadOptions" (uploadStart)="uploadStart($event)" (uploadComplete)="uploadComplete($event)" (uploadError)="uploadError($event)" />
    </label>`,
  }),
  play: async ({ canvas, step, userEvent }) => {
    await step('create an upload task when a resume is selected', async () => {
      const resume = new File(['candidate resume'], 'ada-lovelace-resume.pdf', {
        type: 'application/pdf',
      });
      const input = canvas.getByLabelText(/candidate resume/i);

      upload.mockClear();
      uploadStart.mockClear();

      await userEvent.upload(input, resume);

      await expect(upload).toHaveBeenCalledWith(resume, {
        autoStart: false,
        metadata: {
          source: 'candidate-resume',
        },
      });
      await expect(uploadStart).toHaveBeenCalledTimes(1);
    });
  },
};
