import { describe, expect, it } from 'vitest';
import { rk4Step } from '../src/core/integrators';
import { DampedPendulum } from '../src/simulations/dampedPendulum';
import { REGRESSION_THRESHOLDS } from './regressionThresholds';

describe('DampedPendulum regression', () => {
  it('amplitude envelope decays over time', () => {
    const sim = new DampedPendulum({
      length: 1.2,
      gravity: 9.81,
      damping: 0.18,
      mass: 1,
      initialAngle: 1.0,
      initialAngularVelocity: 0,
    });

    const dt = 1 / 240;
    const totalSteps = 240 * 24; // 24 s
    const segments = 8;
    const stepsPerSegment = Math.floor(totalSteps / segments);

    let t = 0;
    let state = sim.getState();
    const segMax: number[] = [];
    let currentMax = 0;
    let count = 0;

    for (let i = 0; i < totalSteps; i += 1) {
      state = rk4Step(state, t, dt, sim.derivatives.bind(sim));
      t += dt;

      currentMax = Math.max(currentMax, Math.abs(state[0]));
      count += 1;

      if (count === stepsPerSegment) {
        segMax.push(currentMax);
        currentMax = 0;
        count = 0;
      }
    }

    expect(segMax.length).toBe(segments);

    let nonIncreasingCount = 0;
    for (let i = 1; i < segMax.length; i += 1) {
      if (segMax[i] <= segMax[i - 1]) nonIncreasingCount += 1;
    }

    const decayRatio = segMax[segMax.length - 1] / segMax[0];
    console.log(`DampedPendulum decayRatio: ${decayRatio}`);
    console.log(`DampedPendulum nonIncreasingCount: ${nonIncreasingCount}`);

    // 대부분 구간에서 진폭 외피가 감소해야 함
    expect(nonIncreasingCount).toBeGreaterThanOrEqual(REGRESSION_THRESHOLDS.dampedPendulum.nonIncreasingMin);
    expect(decayRatio).toBeLessThan(REGRESSION_THRESHOLDS.dampedPendulum.decayRatioMax);
  });

  it('total energy dissipates with damping', () => {
    const sim = new DampedPendulum({
      length: 1.2,
      gravity: 9.81,
      damping: 0.18,
      mass: 1,
      initialAngle: 1.0,
      initialAngularVelocity: 0,
    });

    const params = sim.getParams();
    const energy = (s: number[]) => {
      const [theta, omega] = s;
      const kinetic = 0.5 * params.mass * (params.length * omega) ** 2;
      const potential = params.mass * params.gravity * params.length * (1 - Math.cos(theta));
      return kinetic + potential;
    };

    const dt = 1 / 240;
    const totalSteps = 240 * 30; // 30 s

    let t = 0;
    let state = sim.getState();

    const e0 = energy(state);
    let prevE = e0;
    let maxUpSpike = 0;

    for (let i = 0; i < totalSteps; i += 1) {
      state = rk4Step(state, t, dt, sim.derivatives.bind(sim));
      t += dt;

      const e = energy(state);
      const up = e - prevE;
      if (up > maxUpSpike) maxUpSpike = up;
      prevE = e;
    }

    const eEnd = energy(state);
    const endRatio = eEnd / e0;
    const upSpikeRatio = maxUpSpike / e0;

    console.log(`DampedPendulum endRatio: ${endRatio}`);
    console.log(`DampedPendulum upSpikeRatio: ${upSpikeRatio}`);

    expect(endRatio).toBeLessThan(REGRESSION_THRESHOLDS.dampedPendulum.endEnergyRatioMax);
    expect(upSpikeRatio).toBeLessThan(REGRESSION_THRESHOLDS.dampedPendulum.upSpikeRatioMax);
  });
});
