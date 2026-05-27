/** Request body for generating a signed read URL. */
export interface SignedUrlRequestDto {
  /** Driver-relative storage key to sign. */
  key: string;
  /** Requested time-to-live in seconds. */
  expiresIn?: number;
}
