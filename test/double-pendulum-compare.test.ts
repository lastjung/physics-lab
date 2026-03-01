import { describe, expect, it } from 'vitest';
import { DoublePendulumCompare } from '../src/simulations/doublePendulumCompare';

describe('Double Pendulum Compare Simulation', () => {
  it('diverges when epsilon > 0', () => {
    const model = new DoublePendulumCompare({ epsilon: 1e-4, damping: 0 });
    const stats0 = model.getStats();
    expect(stats0.distance).toBeCloseTo(1e-4, 1e-6);

    const dt = 1/60;
    // Simulate long enough to see divergence in a chaotic system
    for (let i = 0; i < 600; i++) {
        const state = model.getState();
        const deriv = model.derivatives(state);
        const nextState = state.map((v, idx) => v + deriv[idx] * dt);
        model.setState(nextState);
        model.setTime(model.getTime() + dt);
    }

    const stats1 = model.getStats();
    console.log(`DP Compare [ε=1e-4] Initial Dist: ${stats0.distance.toExponential(4)}`);
    console.log(`DP Compare [ε=1e-4] Final Dist (10s): ${stats1.distance.toExponential(4)}`);
    console.log(`DP Compare [ε=1e-4] Lyapunov Approx: ${stats1.lyapunov.toFixed(4)}`);
    
    // In a chaotic double pendulum, 10 seconds (600 steps) should show significant divergence from 1e-4
    expect(stats1.distance).toBeGreaterThan(1e-4);
    expect(stats1.lyapunov).toBeGreaterThan(-1); // Should typically be positive for chaotic regions or at least not extremely negative
  });

  it('remains identical when epsilon = 0', () => {
    const model = new DoublePendulumCompare({ epsilon: 0, damping: 0 });
    const dt = 1/60;
    
    for (let i = 0; i < 200; i++) {
        const state = model.getState();
        const deriv = model.derivatives(state);
        const nextState = state.map((v, idx) => v + deriv[idx] * dt);
        model.setState(nextState);
        model.setTime(model.getTime() + dt);
    }

    const stats = model.getStats();
    expect(stats.distance).toBeLessThan(1e-10);
  });

  it('provides finite stats', () => {
    const model = new DoublePendulumCompare();
    const stats = model.getStats();
    expect(Number.isFinite(stats.distance)).toBe(true);
    expect(Number.isFinite(stats.lyapunov)).toBe(true);
    expect(Number.isFinite(stats.dt1)).toBe(true);
    expect(Number.isFinite(stats.dt2)).toBe(true);
  });

  it('sync reset perfectly overlaps both pendulums at t=0', () => {
    const model = new DoublePendulumCompare({ epsilon: 1e-3 });
    model.setTime(2.5);
    model.syncReset();

    const state = model.getState();
    expect(model.getTime()).toBe(0);
    expect(state[0]).toBeCloseTo(state[4], 12);
    expect(state[1]).toBeCloseTo(state[5], 12);
    expect(state[2]).toBeCloseTo(0, 12);
    expect(state[3]).toBeCloseTo(0, 12);
    expect(state[6]).toBeCloseTo(0, 12);
    expect(state[7]).toBeCloseTo(0, 12);
  });
});
