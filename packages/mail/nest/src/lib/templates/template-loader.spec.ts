import * as fs from 'fs/promises';
import { TemplateLoader } from './template-loader';

vi.mock('fs/promises');

describe(TemplateLoader.name, () => {
  const readFileMock = vi.mocked(fs.readFile);

  beforeEach(() => vi.clearAllMocks());

  it('reads the correct file path', async () => {
    readFileMock.mockResolvedValue('<p>Hello</p>');
    const loader = new TemplateLoader();

    await loader.load('/templates', 'welcome');

    expect(readFileMock).toHaveBeenCalledWith(
      '/templates/welcome.html',
      'utf-8',
    );
  });

  it('returns the file contents', async () => {
    readFileMock.mockResolvedValue('<p>content</p>');
    const loader = new TemplateLoader();

    const result = await loader.load('/templates', 'welcome');

    expect(result).toBe('<p>content</p>');
  });

  it('returns cached content on second call without reading disk again', async () => {
    readFileMock.mockResolvedValue('<p>cached</p>');
    const loader = new TemplateLoader();

    await loader.load('/templates', 'welcome');
    await loader.load('/templates', 'welcome');

    expect(readFileMock).toHaveBeenCalledTimes(1);
  });

  it('throws a descriptive error when the template file does not exist', async () => {
    readFileMock.mockRejectedValue(new Error('ENOENT'));
    const loader = new TemplateLoader();

    await expect(loader.load('/templates', 'missing')).rejects.toThrow(
      'Mail template "missing" not found at /templates/missing.html',
    );
  });
});
