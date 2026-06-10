import { Readable } from 'node:stream';

type Storage = Map<string, Buffer>;
type Multiparts = Map<string, { key: string; parts: Map<number, Buffer> }>;

const toBuffer = async (body: unknown): Promise<Buffer> => {
  if (Buffer.isBuffer(body)) return body;
  if (typeof body === 'string') return Buffer.from(body);
  if (body instanceof Uint8Array) return Buffer.from(body);
  const chunks: Buffer[] = [];
  for await (const chunk of body as AsyncIterable<
    Buffer | Uint8Array | string
  >) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
};

/**
 * Creates an in-memory AWS S3 client mock for storage driver tests.
 *
 * The returned object implements the `send` method shape used by the S3 driver
 * and keeps object and multipart state externally inspectable for assertions.
 */
export function createMockS3({
  storage = new Map<string, Buffer>(),
  multiparts = new Map<string, { key: string; parts: Map<number, Buffer> }>(),
}: { storage?: Storage; multiparts?: Multiparts } = {}) {
  let nextUploadId = 1;
  const send = vi.fn(async (cmd: any) => {
    const name = cmd.constructor.name;
    if (name === 'PutObjectCommand') {
      storage.set(cmd.input.Key, await toBuffer(cmd.input.Body));
      return {};
    }
    if (name === 'GetObjectCommand') {
      const body = storage.get(cmd.input.Key);
      if (!body)
        throw Object.assign(new Error('NotFound'), { name: 'NotFound' });
      return { Body: Readable.from(body) };
    }
    if (name === 'DeleteObjectCommand') {
      storage.delete(cmd.input.Key);
      return {};
    }
    if (name === 'HeadObjectCommand') {
      if (!storage.has(cmd.input.Key))
        throw Object.assign(new Error('NotFound'), { name: 'NotFound' });
      return {};
    }
    if (name === 'CreateMultipartUploadCommand') {
      const uploadId = `mp-${nextUploadId++}`;
      multiparts.set(uploadId, { key: cmd.input.Key, parts: new Map() });
      return { UploadId: uploadId };
    }
    if (name === 'UploadPartCommand') {
      const multipart = multiparts.get(cmd.input.UploadId);
      if (!multipart)
        throw new Error(`Unknown multipart upload ${cmd.input.UploadId}`);
      multipart.parts.set(cmd.input.PartNumber, await toBuffer(cmd.input.Body));
      return { ETag: `"etag-${cmd.input.PartNumber}"` };
    }
    if (name === 'CompleteMultipartUploadCommand') {
      const multipart = multiparts.get(cmd.input.UploadId);
      if (!multipart)
        throw new Error(`Unknown multipart upload ${cmd.input.UploadId}`);
      const sorted = [...multipart.parts.entries()]
        .sort(([a], [b]) => a - b)
        .map(([, buffer]) => buffer);
      storage.set(multipart.key, Buffer.concat(sorted));
      multiparts.delete(cmd.input.UploadId);
      return {};
    }
    if (name === 'AbortMultipartUploadCommand') {
      multiparts.delete(cmd.input.UploadId);
      return {};
    }
    throw new Error(`Unhandled ${name}`);
  });
  return { send, storage, multiparts };
}
