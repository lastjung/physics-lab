import { describe, expect, it } from 'vitest';

import { rk4Step } from '../src/core/integrators';

describe('rk4Step', () => {
  it('approximates harmonic oscillator step', () => {
    const deriv = ([x, v]: number[]) => [v, -x];
    const dt = 0.1;
    const next = rk4Step([1, 0], 0, dt, deriv);

    expect(next[0]).toBeCloseTo(Math.cos(dt), 4);
    expect(next[1]).toBeCloseTo(-Math.sin(dt), 4);
  });
});
