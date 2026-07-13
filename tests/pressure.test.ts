import { describe, expect, it } from 'vitest';
import { SHIFT_END, SHIFT_START } from '../src/core/content';
import { calculateDifficulty, employmentStatusForRisk } from '../src/core/pressure';

describe('progressive pressure', () => {
  it('starts gently and increases through the shift', () => {
    const start = calculateDifficulty(SHIFT_START);
    const middle = calculateDifficulty((SHIFT_START + SHIFT_END) / 2);
    const end = calculateDifficulty(SHIFT_END);

    expect(start).toBeLessThan(15);
    expect(middle).toBeGreaterThan(start);
    expect(end).toBeGreaterThan(middle);
    expect(end).toBe(100);
  });

  it('uses clear employment warning thresholds', () => {
    expect(employmentStatusForRisk(20)).toBe('secure');
    expect(employmentStatusForRisk(52)).toBe('watch');
    expect(employmentStatusForRisk(72)).toBe('probation');
    expect(employmentStatusForRisk(100)).toBe('fired');
  });
});
