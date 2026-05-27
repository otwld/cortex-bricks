/** Injection token for TUS module options. */
export const TUS_MODULE_OPTIONS = 'TUS_MODULE_OPTIONS';

/** Configuration for the TUS resumable upload module. */
export interface TusModuleOptions {
  /** Public path used when constructing upload locations. */
  path?: string;
  /** Maximum upload size advertised and enforced by TUS. */
  maxSize: number;
  /** Upload state lifetime in seconds. */
  uploadStateTtl: number;
  /** Cleanup sweep interval in milliseconds. */
  cleanupIntervalMs: number;
  /** Origin echoed back as `Access-Control-Allow-Origin`. Default: '*'. Set explicitly to a string for production. */
  allowOrigin?: string;
}
