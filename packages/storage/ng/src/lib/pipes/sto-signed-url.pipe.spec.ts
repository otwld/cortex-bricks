import { HttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';
import { provideStorage } from '../provide-storage';
import { StoSignedUrlPipe } from './sto-signed-url.pipe';

describe('StoSignedUrlPipe', () => {
  const post = vi.fn(() => of({ url: 'https://x', expiresAt: Date.now() + 120_000 }));

  beforeEach(() => {
    post.mockClear();
    TestBed.configureTestingModule({
      providers: [
        provideStorage({ tusEndpoint: '/x', signedUrlEndpoint: '/signed' }),
        { provide: HttpClient, useValue: { post } },
      ],
    });
  });

  it('caches by key', async () => {
    const pipe = TestBed.runInInjectionContext(() => new StoSignedUrlPipe());
    const first = await firstValueFrom(pipe.transform('a'));
    const second = await firstValueFrom(pipe.transform('a'));
    expect(first).toBe(second);
    expect(post).toHaveBeenCalledTimes(1);
  });
});
