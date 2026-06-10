const PREFIX = 'sto-tus::';

interface PreviousUpload {
  size: number | null;
  metadata: { [key: string]: string };
  creationTime: string;
  urlStorageKey: string;
  uploadUrl: string | null;
  parallelUploadUrls: string[] | null;
}

/**
 * tus-js-client URL storage backed by browser `localStorage`.
 *
 * Entries are namespaced so resumable upload fingerprints owned by the storage
 * brick can be cleared without touching unrelated application keys.
 */
export class LocalStorageUrlStorage {
  /**
   * Returns every stored upload URL owned by the storage brick namespace.
   */
  async findAllUploads(): Promise<PreviousUpload[]> {
    return Object.keys(localStorage)
      .filter((key) => key.startsWith(PREFIX))
      .flatMap((key) => this.read(key));
  }

  /**
   * Returns stored upload URLs for one tus fingerprint.
   */
  async findUploadsByFingerprint(fingerprint: string): Promise<PreviousUpload[]> {
    return this.read(this.key(fingerprint));
  }

  /**
   * Removes a stored upload URL by its storage key.
   */
  async removeUpload(urlStorageKey: string): Promise<void> {
    localStorage.removeItem(urlStorageKey);
  }

  /**
   * Stores a resumable upload URL for one tus fingerprint.
   */
  async addUpload(fingerprint: string, upload: PreviousUpload): Promise<string> {
    const key = this.key(fingerprint);
    localStorage.setItem(key, JSON.stringify({ ...upload, urlStorageKey: key }));
    return key;
  }

  private key(fingerprint: string): string {
    return `${PREFIX}${fingerprint}`;
  }

  private read(key: string): PreviousUpload[] {
    const value = localStorage.getItem(key);
    if (!value) return [];
    try {
      return [{ ...(JSON.parse(value) as PreviousUpload), urlStorageKey: key }];
    } catch {
      localStorage.removeItem(key);
      return [];
    }
  }
}

/**
 * Removes a stored tus upload URL for one upload fingerprint.
 */
export function removeStoredUpload(fingerprint: string): void {
  localStorage.removeItem(`${PREFIX}${fingerprint}`);
}
