/** Storage backends supported by the storage library. */
export enum StorageDriver {
  /** Amazon S3 compatible object storage. */
  S3 = 's3',
  /** Local filesystem storage rooted at a configured directory. */
  Filesystem = 'filesystem',
}
