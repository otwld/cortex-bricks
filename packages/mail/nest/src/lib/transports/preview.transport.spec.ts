import { RawMailMessage } from './mail-transport.interface';
import { PreviewTransport } from './preview.transport';

type SendMailMock = (message: unknown) => Promise<unknown>;
type MockTransporter = {
  sendMail: SendMailMock;
};

const createTransportMock = vi.hoisted(() =>
  vi.fn<(options?: unknown) => MockTransporter>(),
);

vi.mock('nodemailer', () => ({
  createTransport: createTransportMock,
  default: { createTransport: createTransportMock },
}));

const message: RawMailMessage = {
  to: 'user@example.com',
  from: 'noreply@example.com',
  subject: 'Hello',
  html: '<p>Hello</p>',
};

describe(PreviewTransport.name, () => {
  afterEach(() => {
    vi.restoreAllMocks();
    createTransportMock.mockReset();
  });

  it('logs message to console when no mailpit config is provided', async () => {
    const consoleSpy = vi
      .spyOn(console, 'log')
      .mockImplementation(() => undefined);
    const transport = new PreviewTransport();

    await transport.send(message);

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[nest-mail:preview]'),
    );
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Hello'));
  });

  it('does not throw when sending without mailpit config', async () => {
    const transport = new PreviewTransport();
    await expect(transport.send(message)).resolves.toBeUndefined();
  });

  it('creates nodemailer transport when mailpit config is provided', async () => {
    const sendMailMock = vi.fn<SendMailMock>().mockResolvedValue({});
    createTransportMock.mockReturnValue({
      sendMail: sendMailMock,
    });

    const transport = new PreviewTransport({ host: 'localhost', port: 1025 });
    await transport.send(message);

    expect(createTransportMock).toHaveBeenCalledWith({
      host: 'localhost',
      port: 1025,
    });
    expect(sendMailMock).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'user@example.com', subject: 'Hello' }),
    );
  });
});
