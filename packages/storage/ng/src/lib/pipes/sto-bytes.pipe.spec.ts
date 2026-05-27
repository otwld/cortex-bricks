import { StoBytesPipe } from './sto-bytes.pipe';

describe('StoBytesPipe', () => {
  const pipe = new StoBytesPipe();

  it('formats bytes', () => expect(pipe.transform(1024)).toBe('1 KB'));
  it('handles zero', () => expect(pipe.transform(0)).toBe('0 B'));
});
