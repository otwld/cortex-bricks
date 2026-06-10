import { TestBed } from '@angular/core/testing';
import { STORAGE_CONFIG } from '@otwld/ng-storage';
import { appConfig } from './app.config';

describe('appConfig storage providers', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('connects the Angular storage client to the backend storage endpoints', () => {
    TestBed.configureTestingModule({ providers: appConfig.providers });

    expect(TestBed.inject(STORAGE_CONFIG)).toEqual(
      expect.objectContaining({
        tusEndpoint: '/api/storage/tus',
        signedUrlEndpoint: '/api/storage/signed-url',
      }),
    );
  });
});
