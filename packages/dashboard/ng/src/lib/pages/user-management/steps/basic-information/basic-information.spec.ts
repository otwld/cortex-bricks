import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { StorageDriver, UploadStatus } from '@otwld/ts-storage';
import { StorageService } from '@otwld/ng-storage';
import { FormStateService } from '../../form-state.service';
import { BasicInformation } from './basic-information';

describe(BasicInformation.name, () => {
  let fixture: ComponentFixture<BasicInformation>;
  let formState: FormStateService;
  const storage = {
    upload: vi.fn(),
  };

  beforeEach(async () => {
    storage.upload.mockReset();

    await TestBed.configureTestingModule({
      imports: [BasicInformation],
      providers: [
        FormStateService,
        { provide: Router, useValue: { navigate: vi.fn() } },
        { provide: StorageService, useValue: storage },
      ],
    }).compileComponents();

    formState = TestBed.inject(FormStateService);
    fixture = TestBed.createComponent(BasicInformation);
    fixture.detectChanges();
  });

  it('uploads selected avatar images through ng-storage and stores the storage key', () => {
    const file = new File(['avatar'], 'avatar.png', { type: 'image/png' });
    const task = {
      id: 'upload-1',
      file,
      status: signal(UploadStatus.Completed).asReadonly(),
      progress: signal(100).asReadonly(),
      bytesUploaded: signal(file.size).asReadonly(),
      error: signal<Error | null>(null).asReadonly(),
      storageFile: signal({
        id: 'file-1',
        key: 'uploads/avatar.png',
        filename: 'avatar.png',
        mimetype: 'image/png',
        size: file.size,
        driver: StorageDriver.S3,
        checksum: 'sha256',
        createdAt: new Date('2026-05-08T00:00:00.000Z'),
        updatedAt: new Date('2026-05-08T00:00:00.000Z'),
      }).asReadonly(),
      retryAttempt: signal(0).asReadonly(),
      nextRetryIn: signal(0).asReadonly(),
    };
    storage.upload.mockReturnValue(task);

    fixture.componentInstance.uploadAvatar({ files: [file] });

    expect(storage.upload).toHaveBeenCalledWith(file, {
      accept: 'image/*',
      maxSize: 1_000_000,
      metadata: {
        source: 'dashboard-user-avatar',
      },
    });
    expect(formState.formState().avatar).toBe('uploads/avatar.png');
  });
});
