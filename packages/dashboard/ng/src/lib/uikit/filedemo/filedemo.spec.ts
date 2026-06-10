import { TestBed } from '@angular/core/testing';
import { MessageService } from 'primeng/api';
import { StorageService } from '@otwld/ng-storage';
import { FileDemo } from './filedemo';

describe(FileDemo.name, () => {
  it('uploads PrimeNG selected files through ng-storage', () => {
    const files = [new File(['avatar'], 'avatar.png', { type: 'image/png' })];
    const storage = {
      uploadGroup: vi.fn().mockReturnValue({
        id: 'group-1',
        tasks: () => [],
        status: () => 'completed',
        progress: () => 100,
        pause: vi.fn(),
        resume: vi.fn(),
        cancel: vi.fn(),
      }),
    };
    TestBed.configureTestingModule({
      providers: [MessageService, { provide: StorageService, useValue: storage }],
    });
    const component = TestBed.runInInjectionContext(() => new FileDemo());

    component.uploadWithStorage({ files }, 'advanced');

    expect(storage.uploadGroup).toHaveBeenCalledWith(files, {
      accept: 'image/*',
      maxSize: 1_000_000,
      metadata: {
        mode: 'advanced',
        source: 'dashboard-filedemo',
      },
    });
  });
});
