import { RawMailMessage } from './mail-transport.interface';
import { SmtpTransport, SmtpTransportOptions } from './smtp.transport';

const createTransportMock = vi.hoisted(() => vi.fn());

vi.mock('nodemailer', () => ({
  createTransport: createTransportMock,
  default: { createTransport: createTransportMock },
}));

const message: RawMailMessage = {
  to: 'user@example.com',
  from: 'noreply@example.com',
  subject: 'Test',
  html: '<p>Test</p>',
};

describe(SmtpTransport.name, () => {
  afterEach(() => createTransportMock.mockReset());

  it('creates a nodemailer transporter with the provided SMTP options', async () => {
    const sendMailMock = vi.fn().mockResolvedValue({});
    createTransportMock.mockReturnValue({
      sendMail: sendMailMock,
    } as never);

    const options: SmtpTransportOptions = {
      host: 'smtp.zoho.com',
      port: 587,
      secure: false,
      auth: { user: 'me@example.com', pass: 'secret' },
    };
    const transport = new SmtpTransport(options);
    await transport.send(message);

    expect(createTransportMock).toHaveBeenCalledWith(options);
  });

  it('calls sendMail with mapped message fields', async () => {
    const sendMailMock = vi.fn().mockResolvedValue({});
    createTransportMock.mockReturnValue({ sendMail: sendMailMock } as never);

    const transport = new SmtpTransport({ host: 'localhost', port: 25 });
    await transport.send({ ...message, replyTo: 'reply@example.com' });

    expect(sendMailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'user@example.com',
        from: 'noreply@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
        replyTo: 'reply@example.com',
      }),
    );
  });
});
