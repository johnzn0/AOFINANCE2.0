import { describe, it, expect } from 'vitest';
import { fmt, getCatColor } from './formatters';

describe('formatters', () => {
  it('should format positive values correctly', () => {
    expect(fmt(1234.56)).toMatch(/R\$\s*1\.234,56/);
  });

  it('should format negative values correctly', () => {
    expect(fmt(-1234.56)).toMatch(/-R\$\s*1\.234,56/);
  });

  it('should return valid category colors', () => {
    const color = getCatColor('Casa');
    expect(typeof color).toBe('string');
  });
});
