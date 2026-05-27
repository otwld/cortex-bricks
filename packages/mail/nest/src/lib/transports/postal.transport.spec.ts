import type { Mock, MockedFunction } from 'vitest';
import { RawMailMessage } from './mail-transport.interface';
import { PostalTransport } from './postal.transport';
import * as fs from 'fs/promises';

vi.mock('fs/promises');

const message: RawMailMessage = {
  to: ['user@example.com'],
  from: 'noreply@example.com',
  subject: 'Hello',
  html: '<p>Hello</p>',
  text: 'Hello',
};

describe(PostalTransport.name, () => {
  const readFileMock = fs.readFile as MockedFunction<typeof fs.readFile>;

  beforeEach(() => {
    global.fetch = vi.fn();
    readFileMock.mockReset();
  });

  afterEach(() => vi.restoreAllMocks());

  it('POSTs to the correct Postal API endpoint', async () => {
    (global.fetch as Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'success', data: {} }),
    });
    const transport = new PostalTransport({
      serverUrl: 'https://postal.example.com',
      apiKey: 'key-123',
    });

    await transport.send(message);

    expect(global.fetch).toHaveBeenCalledWith(
      'https://postal.example.com/api/v1/send/message',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('sets the X-Server-API-Key header', async () => {
    (global.fetch as Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'success', data: {} }),
    });
    const transport = new PostalTransport({
      serverUrl: 'https://postal.example.com',
      apiKey: 'key-123',
    });

    await transport.send(message);

    const [, init] = (global.fetch as Mock).mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect((init.headers as Record<string, string>)['X-Server-API-Key']).toBe(
      'key-123',
    );
  });

  it('sends recipient, subject, and html_body in the request body', async () => {
    (global.fetch as Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'success', data: {} }),
    });
    const transport = new PostalTransport({
      serverUrl: 'https://postal.example.com',
      apiKey: 'key-123',
    });

    await transport.send(message);

    const [, init] = (global.fetch as Mock).mock.calls[0] as [
      string,
      RequestInit,
    ];
    const body = JSON.parse(init.body as string) as Record<string, unknown>;
    expect(body).toMatchObject({
      to: ['user@example.com'],
      from: 'noreply@example.com',
      subject: 'Hello',
      html_body: '<p>Hello</p>',
      plain_body: 'Hello',
    });
  });

  it('throws when the Postal API returns an error status', async () => {
    (global.fetch as Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        status: 'error',
        data: { code: 'InvalidApiKey', message: 'Bad key' },
      }),
    });
    const transport = new PostalTransport({
      serverUrl: 'https://postal.example.com',
      apiKey: 'bad',
    });

    await expect(transport.send(message)).rejects.toThrow(
      'Postal API error: Bad key',
    );
  });

  it('throws when the HTTP response is not ok', async () => {
    (global.fetch as Mock).mockResolvedValue({ ok: false, status: 500 });
    const transport = new PostalTransport({
      serverUrl: 'https://postal.example.com',
      apiKey: 'key',
    });

    await expect(transport.send(message)).rejects.toThrow(
      'Postal HTTP error: 500',
    );
  });

  it('reads path-based attachments before sending them to Postal', async () => {
    readFileMock.mockResolvedValue(Buffer.from('pdf bytes') as never);
    (global.fetch as Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'success', data: {} }),
    });
    const transport = new PostalTransport({
      serverUrl: 'https://postal.example.com',
      apiKey: 'key-123',
    });

    await transport.send({
      ...message,
      attachments: [
        {
          filename: 'invoice.pdf',
          path: '/tmp/invoice.pdf',
          contentType: 'application/pdf',
        },
      ],
    });

    const [, init] = (global.fetch as Mock).mock.calls[0] as [
      string,
      RequestInit,
    ];
    const body = JSON.parse(init.body as string) as {
      attachments: Array<{ data: string }>;
    };
    expect(readFileMock).toHaveBeenCalledWith('/tmp/invoice.pdf');
    expect(body.attachments[0]).toMatchObject({
      data: Buffer.from('pdf bytes').toString('base64'),
    });
  });
});
