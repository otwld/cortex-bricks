import { Readable } from 'node:stream';

type Storage = Map<string, Buffer>;
type Multiparts = Map<string, { key: string; parts: Map<number, Buffer> }>;
type MockS3CommandInput = {
  Key?: string;
  Body?: unknown;
  UploadId?: string;
  PartNumber?: number;
};
type MockS3Command = { constructor: { name: string }; input: MockS3CommandInput };

const requireStringInput = (value: string | undefined, field: string): string => {
  if (value === undefined) throw new Error(`Mock S3 command missing ${field}`);
  return value;
};

const requireNumberInput = (value: number | undefined, field: string): number => {
  if (value === undefined) throw new Error(`Mock S3 command missing ${field}`);
  return value;
};

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
  const send = vi.fn(async (cmd: MockS3Command) => {
    const name = cmd.constructor.name;
    if (name === 'PutObjectCommand') {
      storage.set(requireStringInput(cmd.input.Key, 'Key'), await toBuffer(cmd.input.Body));
      return {};
    }
    if (name === 'GetObjectCommand') {
      const body = storage.get(requireStringInput(cmd.input.Key, 'Key'));
      if (!body)
        throw Object.assign(new Error('NotFound'), { name: 'NotFound' });
      return { Body: Readable.from(body) };
    }
    if (name === 'DeleteObjectCommand') {
      storage.delete(requireStringInput(cmd.input.Key, 'Key'));
      return {};
    }
    if (name === 'HeadObjectCommand') {
      if (!storage.has(requireStringInput(cmd.input.Key, 'Key')))
        throw Object.assign(new Error('NotFound'), { name: 'NotFound' });
      return {};
    }
    if (name === 'CreateMultipartUploadCommand') {
      const uploadId = `mp-${nextUploadId++}`;
      multiparts.set(uploadId, { key: requireStringInput(cmd.input.Key, 'Key'), parts: new Map() });
      return { UploadId: uploadId };
    }
    if (name === 'UploadPartCommand') {
      const uploadId = requireStringInput(cmd.input.UploadId, 'UploadId');
      const partNumber = requireNumberInput(cmd.input.PartNumber, 'PartNumber');
      const multipart = multiparts.get(uploadId);
      if (!multipart)
        throw new Error(`Unknown multipart upload ${uploadId}`);
      multipart.parts.set(partNumber, await toBuffer(cmd.input.Body));
      return { ETag: `"etag-${partNumber}"` };
    }
    if (name === 'CompleteMultipartUploadCommand') {
      const uploadId = requireStringInput(cmd.input.UploadId, 'UploadId');
      const multipart = multiparts.get(uploadId);
      if (!multipart)
        throw new Error(`Unknown multipart upload ${uploadId}`);
      const sorted = [...multipart.parts.entries()]
        .sort(([a], [b]) => a - b)
        .map(([, buffer]) => buffer);
      storage.set(multipart.key, Buffer.concat(sorted));
      multiparts.delete(uploadId);
      return {};
    }
    if (name === 'AbortMultipartUploadCommand') {
      multiparts.delete(requireStringInput(cmd.input.UploadId, 'UploadId'));
      return {};
    }
    throw new Error(`Unhandled ${name}`);
  });
  return { send, storage, multiparts };
}
