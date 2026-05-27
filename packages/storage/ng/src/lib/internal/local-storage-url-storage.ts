const PREFIX = 'sto-tus::';

interface PreviousUpload {
  size: number | null;
  metadata: { [key: string]: string };
  creationTime: string;
  urlStorageKey: string;
  uploadUrl: string | null;
  parallelUploadUrls: string[] | null;
}

export class LocalStorageUrlStorage {
  async findAllUploads(): Promise<PreviousUpload[]> {
    return Object.keys(localStorage)
      .filter((key) => key.startsWith(PREFIX))
      .flatMap((key) => this.read(key));
  }

  async findUploadsByFingerprint(fingerprint: string): Promise<PreviousUpload[]> {
    return this.read(this.key(fingerprint));
  }

  async removeUpload(urlStorageKey: string): Promise<void> {
    localStorage.removeItem(urlStorageKey);
  }

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

export function removeStoredUpload(fingerprint: string): void {
  localStorage.removeItem(`${PREFIX}${fingerprint}`);
}
