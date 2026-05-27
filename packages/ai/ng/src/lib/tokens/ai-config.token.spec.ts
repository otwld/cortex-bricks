import { normalizeAiConfig } from './ai-config.token';

describe('normalizeAiConfig', () => {
  it('normalizes trailing slashes', () => {
    expect(normalizeAiConfig({ apiBaseUrl: '/api/ai/' }).apiBaseUrl).toBe('/api/ai');
  });

  it('defaults credentials to same-origin', () => {
    expect(normalizeAiConfig({ apiBaseUrl: '/api/ai' }).credentials).toBe('same-origin');
  });
});
