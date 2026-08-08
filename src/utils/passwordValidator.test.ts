import { describe, it, expect } from 'vitest';
import { validatePasswordRequirements } from './passwordValidator';

describe('validatePasswordRequirements', () => {
  it('should invalidate short passwords', () => {
    const result = validatePasswordRequirements('short');
    expect(result.isValid).toBe(false);
  });

  it('should validate strong passwords', () => {
    const result = validatePasswordRequirements('StrongP@ssw0rd!');
    expect(result.isValid).toBe(true);
  });
});
