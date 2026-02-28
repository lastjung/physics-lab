import { describe, expect, it } from 'vitest';
import { rk4Step } from '../src/core/integrators';
import { OrbitSim } from '../src/simulations/orbit';
import { REGRESSION_THRESHOLDS } from './regressionThresholds';

describe('Orbit regression', () => {
  it('conserves energy within tolerance when damping=0', () => {
    const sim = new OrbitSim({
      mu: 9.5,
      damping: 0,
      initialX: 1.2,
      initialY: 0,
      initialVx: 0,
      initialVy: 2.6,
    });

    const dt = 1 / 240;
    const totalSteps = 240 * 30; // 30 s

    const energy = (s: number[]) => {
      const [x, y, vx, vy] = s;
      const r = Math.max(0.15, Math.hypot(x, y));
      return 0.5 * (vx * vx + vy * vy) - 9.5 / r;
    };

    let t = 0;
    let state = sim.getState();
    const e0 = energy(state);
    let maxRelDrift = 0;

    for (let i = 0; i < totalSteps; i += 1) {
      state = rk4Step(state, t, dt, sim.derivatives.bind(sim));
      t += dt;
      const rel = Math.abs(energy(state) - e0) / Math.max(1e-9, Math.abs(e0));
      if (rel > maxRelDrift) maxRelDrift = rel;
    }

    console.log(`Orbit Energy maxRelDrift: ${maxRelDrift}`);
    expect(maxRelDrift).toBeLessThan(REGRESSION_THRESHOLDS.orbit.energyDriftMax);
  });

  it('conserves angular momentum within tolerance when damping=0', () => {
    const sim = new OrbitSim({
      mu: 9.5,
      damping: 0,
      initialX: 1.2,
      initialY: 0,
      initialVx: 0,
      initialVy: 2.6,
    });

    const dt = 1 / 240;
    const totalSteps = 240 * 30; // 30 s

    const angularMomentum = (s: number[]) => {
      const [x, y, vx, vy] = s;
      return x * vy - y * vx;
    };

    let t = 0;
    let state = sim.getState();
    const h0 = angularMomentum(state);
    let maxRelDrift = 0;

    for (let i = 0; i < totalSteps; i += 1) {
      state = rk4Step(state, t, dt, sim.derivatives.bind(sim));
      t += dt;
      const rel = Math.abs(angularMomentum(state) - h0) / Math.max(1e-9, Math.abs(h0));
      if (rel > maxRelDrift) maxRelDrift = rel;
    }

    console.log(`Orbit Angular Momentum maxRelDrift: ${maxRelDrift}`);
    expect(maxRelDrift).toBeLessThan(REGRESSION_THRESHOLDS.orbit.angularMomentumDriftMax);
  });
});
