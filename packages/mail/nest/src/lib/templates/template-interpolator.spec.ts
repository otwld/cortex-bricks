import { TemplateInterpolator } from './template-interpolator';

describe(TemplateInterpolator.name, () => {
  const interpolator = new TemplateInterpolator();

  it('replaces a single token with its value', () => {
    expect(interpolator.interpolate('<p>Hello {{ name }}</p>', { name: 'Alice' })).toBe('<p>Hello Alice</p>');
  });

  it('replaces multiple distinct tokens', () => {
    expect(interpolator.interpolate('<p>{{ greeting }}, {{ name }}!</p>', { greeting: 'Hi', name: 'Bob' })).toBe(
      '<p>Hi, Bob!</p>',
    );
  });

  it('replaces the same token appearing twice', () => {
    expect(interpolator.interpolate('{{ a }} and {{ a }}', { a: 'x' })).toBe('x and x');
  });

  it('tolerates extra whitespace inside braces', () => {
    expect(interpolator.interpolate('{{  name  }}', { name: 'Carol' })).toBe('Carol');
  });

  it('HTML-escapes string values by default', () => {
    expect(interpolator.interpolate('{{ val }}', { val: '<b>bold</b>' })).toBe('&lt;b&gt;bold&lt;/b&gt;');
  });

  it('HTML-escapes ampersands and quotes', () => {
    expect(interpolator.interpolate('{{ val }}', { val: 'A&B "C" \'D\'' })).toBe(
      'A&amp;B &quot;C&quot; &#039;D&#039;',
    );
  });

  it('leaves unknown tokens unchanged', () => {
    expect(interpolator.interpolate('{{ missing }}', {})).toBe('{{ missing }}');
  });

  it('converts numbers to strings', () => {
    expect(interpolator.interpolate('{{ count }}', { count: 42 })).toBe('42');
  });
});
