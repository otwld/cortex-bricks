import {
  MAIL_MODULE_OPTIONS,
  MailModuleOptions,
} from './config/mail-module-options';
import { MailService } from './mail.service';
import { TemplateInterpolator } from './templates/template-interpolator';
import { TemplateLoader } from './templates/template-loader';
import { MailTransport } from './transports/mail-transport.interface';

function makeOptions(
  overrides: Partial<MailModuleOptions> = {},
): MailModuleOptions {
  return {
    transport: { send: vi.fn().mockResolvedValue(undefined) } as MailTransport,
    defaults: { from: 'noreply@example.com' },
    templates: { dir: '/templates' },
    ...overrides,
  };
}

describe(MailService.name, () => {
  function makeService(options = makeOptions()) {
    return new MailService(
      options,
      new TemplateLoader(),
      new TemplateInterpolator(),
    );
  }

  afterEach(() => vi.restoreAllMocks());

  it('uses the Nest configurable module options token', () => {
    expect(MAIL_MODULE_OPTIONS).toBeDefined();
  });

  it('loads the named template and interpolates context before sending', async () => {
    const options = makeOptions();
    const loadMock = vi
      .spyOn(TemplateLoader.prototype, 'load')
      .mockResolvedValue('<p>Hello {{ name }}</p>');
    const interpolateSpy = vi.spyOn(
      TemplateInterpolator.prototype,
      'interpolate',
    );

    const service = makeService(options);
    await service.send({
      to: 'user@example.com',
      subject: 'Hi',
      template: 'welcome' as never,
      context: { name: 'Alice' } as never,
    });

    expect(loadMock).toHaveBeenCalledWith('/templates', 'welcome');
    expect(interpolateSpy).toHaveBeenCalledWith('<p>Hello {{ name }}</p>', {
      name: 'Alice',
    });
    expect(options.transport.send).toHaveBeenCalledWith(
      expect.objectContaining({ html: '<p>Hello Alice</p>', subject: 'Hi' }),
    );
  });

  it('uses defaults.from when no from override is provided', async () => {
    const options = makeOptions();
    vi.spyOn(TemplateLoader.prototype, 'load').mockResolvedValue(
      '<p>Hello {{ name }}</p>',
    );

    const service = makeService(options);
    await service.send({
      to: 'u@e.com',
      subject: 'S',
      template: 'welcome' as never,
      context: { name: 'x' } as never,
    });

    expect(options.transport.send).toHaveBeenCalledWith(
      expect.objectContaining({ from: 'noreply@example.com' }),
    );
  });

  it('overrides from address when explicitly provided', async () => {
    const options = makeOptions();
    vi.spyOn(TemplateLoader.prototype, 'load').mockResolvedValue('hi');

    const service = makeService(options);
    await service.send({
      to: 'u@e.com',
      subject: 'S',
      template: 'welcome' as never,
      context: {} as never,
      from: 'custom@example.com',
    });

    expect(options.transport.send).toHaveBeenCalledWith(
      expect.objectContaining({ from: 'custom@example.com' }),
    );
  });

  it('sendRaw skips template loading and calls transport directly', async () => {
    const options = makeOptions();
    const loadSpy = vi.spyOn(TemplateLoader.prototype, 'load');

    const service = makeService(options);
    await service.sendRaw({
      to: 'u@e.com',
      subject: 'Raw',
      html: '<p>raw</p>',
    });

    expect(loadSpy).not.toHaveBeenCalled();
    expect(options.transport.send).toHaveBeenCalledWith(
      expect.objectContaining({ html: '<p>raw</p>', subject: 'Raw' }),
    );
  });

  it('uses defaults.replyTo when none provided', async () => {
    const options = makeOptions({
      defaults: { from: 'a@b.com', replyTo: 'support@example.com' },
    });
    vi.spyOn(TemplateLoader.prototype, 'load').mockResolvedValue('html');

    const service = makeService(options);
    await service.send({
      to: 'u@e.com',
      subject: 'S',
      template: 'welcome' as never,
      context: {} as never,
    });

    expect(options.transport.send).toHaveBeenCalledWith(
      expect.objectContaining({ replyTo: 'support@example.com' }),
    );
  });
});
