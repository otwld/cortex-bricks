import * as fs from 'fs/promises';
import { RawMailMessage } from './mail-transport.interface';
import { PostalTransport } from './postal.transport';

vi.mock('fs/promises');

const message: RawMailMessage = {
  to: ['user@example.com'],
  from: 'noreply@example.com',
  subject: 'Hello',
  html: '<p>Hello</p>',
  text: 'Hello',
};

describe(PostalTransport.name, () => {
  const readFileMock = vi.mocked(fs.readFile);

  beforeEach(() => {
    readFileMock.mockReset();
  });

  afterEach(() => vi.restoreAllMocks());

  const postalResponse = (body: unknown, status = 200): Response =>
    new Response(JSON.stringify(body), { status });

  const successfulPostalResponse = () =>
    postalResponse({ status: 'success', data: {} });

  const requestInit = (
    fetchMock: ReturnType<typeof vi.spyOn<typeof globalThis, 'fetch'>>,
  ): RequestInit => {
    const init = fetchMock.mock.calls[0]?.[1];
    if (!init) throw new Error('Expected fetch to receive request options');
    return init;
  };

  const jsonBody = <TBody>(init: RequestInit): TBody => {
    if (typeof init.body !== 'string') {
      throw new Error('Expected Postal request body to be JSON text');
    }
    return JSON.parse(init.body) as TBody;
  };

  it('POSTs to the correct Postal API endpoint', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(successfulPostalResponse());
    const transport = new PostalTransport({
      serverUrl: 'https://postal.example.com',
      apiKey: 'key-123',
    });

    await transport.send(message);

    expect(fetchMock).toHaveBeenCalledWith(
      'https://postal.example.com/api/v1/send/message',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('sets the X-Server-API-Key header', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(successfulPostalResponse());
    const transport = new PostalTransport({
      serverUrl: 'https://postal.example.com',
      apiKey: 'key-123',
    });

    await transport.send(message);

    const headers = new Headers(requestInit(fetchMock).headers);
    expect(headers.get('X-Server-API-Key')).toBe('key-123');
  });

  it('sends recipient, subject, and html_body in the request body', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(successfulPostalResponse());
    const transport = new PostalTransport({
      serverUrl: 'https://postal.example.com',
      apiKey: 'key-123',
    });

    await transport.send(message);

    const body = jsonBody<Record<string, unknown>>(requestInit(fetchMock));
    expect(body).toMatchObject({
      to: ['user@example.com'],
      from: 'noreply@example.com',
      subject: 'Hello',
      html_body: '<p>Hello</p>',
      plain_body: 'Hello',
    });
  });

  it('throws when the Postal API returns an error status', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      postalResponse({
        status: 'error',
        data: { code: 'InvalidApiKey', message: 'Bad key' },
      }),
    );
    const transport = new PostalTransport({
      serverUrl: 'https://postal.example.com',
      apiKey: 'bad',
    });

    await expect(transport.send(message)).rejects.toThrow(
      'Postal API error: Bad key',
    );
  });

  it('throws when the HTTP response is not ok', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 500 }));
    const transport = new PostalTransport({
      serverUrl: 'https://postal.example.com',
      apiKey: 'key',
    });

    await expect(transport.send(message)).rejects.toThrow(
      'Postal HTTP error: 500',
    );
  });

  it('reads path-based attachments before sending them to Postal', async () => {
    readFileMock.mockResolvedValue(Buffer.from('pdf bytes'));
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(successfulPostalResponse());
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

    const body = jsonBody<{
      attachments: Array<{ data: string }>;
    }>(requestInit(fetchMock));
    expect(readFileMock).toHaveBeenCalledWith('/tmp/invoice.pdf');
    expect(body.attachments[0]).toMatchObject({
      data: Buffer.from('pdf bytes').toString('base64'),
    });
  });
});
