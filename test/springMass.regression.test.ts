import { describe, expect, it } from 'vitest';
import { rk4Step } from '../src/core/integrators';
import { SpringMass } from '../src/simulations/springMass';
import { REGRESSION_THRESHOLDS } from './regressionThresholds';

describe('SpringMass regression', () => {
  it('period error stays within 1%', () => {
    const sim = new SpringMass({
      mass: 1,
      stiffness: 18,
      damping: 0,
      initialDisplacement: 0.45,
      initialVelocity: 0,
    });

    const dt = 1 / 240;
    const expectedT = 2 * Math.PI * Math.sqrt(1 / 18);

    let t = 0;
    let state = sim.getState();
    let prevX = state[0];
    const crossingTimes: number[] = [];

    for (let i = 0; i < 20000; i += 1) {
      state = rk4Step(state, t, dt, sim.derivatives.bind(sim));
      t += dt;
      const x = state[0];

      // rising zero-crossing
      if (prevX < 0 && x >= 0) crossingTimes.push(t);
      prevX = x;

      if (crossingTimes.length >= 4) break;
    }

    expect(crossingTimes.length).toBeGreaterThanOrEqual(4);

    const periods: number[] = [];
    for (let i = 1; i < crossingTimes.length; i += 1) {
      periods.push(crossingTimes[i] - crossingTimes[i - 1]);
    }

    const measuredT = periods.reduce((a, b) => a + b, 0) / periods.length;
    const relErr = Math.abs(measuredT - expectedT) / expectedT;
    console.log(`SpringMass Period relErr: ${relErr}`);
    expect(relErr).toBeLessThan(REGRESSION_THRESHOLDS.springMass.periodRelErrMax);
  });

  it('energy drift stays within 0.5% (undamped)', () => {
    const sim = new SpringMass({
      mass: 1,
      stiffness: 18,
      damping: 0,
      initialDisplacement: 0.45,
      initialVelocity: 0,
    });

    const dt = 1 / 240;
    let t = 0;
    let state = sim.getState();

    const energy = (s: number[]) => {
      const [x, v] = s;
      return 0.5 * 1 * v * v + 0.5 * 18 * x * x;
    };

    const e0 = energy(state);
    let maxRelDrift = 0;

    for (let i = 0; i < 20000; i += 1) {
      state = rk4Step(state, t, dt, sim.derivatives.bind(sim));
      t += dt;
      const e = energy(state);
      const rel = Math.abs(e - e0) / e0;
      if (rel > maxRelDrift) maxRelDrift = rel;
    }

    console.log(`SpringMass Max Rel Drift: ${maxRelDrift}`);
    expect(maxRelDrift).toBeLessThan(REGRESSION_THRESHOLDS.springMass.energyDriftMax);
  });
});
