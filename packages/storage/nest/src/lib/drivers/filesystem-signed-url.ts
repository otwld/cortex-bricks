import { createHmac, timingSafeEqual } from 'node:crypto';
import { StorageException } from '../exceptions/storage.exception';

interface FilesystemSignedPayload {
  k: string;
  e: number;
}

function encode(value: object): string {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

function sign(message: string, secret: string): string {
  return createHmac('sha256', secret).update(message).digest('base64url');
}

/**
 * Creates a compact HMAC-signed token for filesystem-backed read URLs.
 *
 * The token format is JWT-like but private to the storage brick; callers should
 * treat it as opaque and validate it with `verifyFilesystemSignedToken`.
 */
export function createFilesystemSignedToken(key: string, secret: string, expiresAt: number): string {
  const header = encode({ alg: 'HS256', typ: 'JWT' });
  const payload = encode({ k: key, e: expiresAt } satisfies FilesystemSignedPayload);
  const message = `${header}.${payload}`;
  return `${message}.${sign(message, secret)}`;
}

/**
 * Verifies and decodes a filesystem signed URL token.
 *
 * Invalid, malformed, or expired tokens are surfaced as storage not-found
 * exceptions so the public filesystem route does not reveal whether the object
 * key exists.
 */
export function verifyFilesystemSignedToken(token: string, secret: string): { key: string; exp: number } {
  const [header, payload, signature] = token.split('.');
  if (!header || !payload || !signature) {
    throw StorageException.fileNotFound('Signed URL token is malformed');
  }

  const message = `${header}.${payload}`;
  const expected = sign(message, secret);
  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(signature);
  if (expectedBuffer.length !== actualBuffer.length || !timingSafeEqual(expectedBuffer, actualBuffer)) {
    throw StorageException.fileNotFound('Signed URL token is invalid');
  }

  let parsed: FilesystemSignedPayload;
  try {
    parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as FilesystemSignedPayload;
  } catch {
    throw StorageException.fileNotFound('Signed URL token payload is invalid');
  }

  if (!parsed.k || !parsed.e || parsed.e <= Math.floor(Date.now() / 1000)) {
    throw StorageException.fileNotFound('Signed URL token has expired');
  }

  return { key: parsed.k, exp: parsed.e };
}
