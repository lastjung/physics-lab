import { describe, expect, it } from 'vitest';
import { HangingChain } from '../src/simulations/hangingChain';

describe('Hanging Chain Simulation', () => {
  it('initializes correctly with default params', () => {
    const model = new HangingChain();
    const state = model.getState();
    const params = model.getParams();
    expect(state.length).toBe(params.segments * 4);
    // Anchor should be at (0, -0.8)
    expect(state[0]).toBe(0);
    expect(state[1]).toBe(-0.8);
  });

  it('maintains anchor position over time', () => {
    const model = new HangingChain();
    const dt = 1/60;
    
    for (let i = 0; i < 100; i++) {
        const deriv = model.derivatives(model.getState());
        const nextState = model.getState().map((v, idx) => v + deriv[idx] * dt);
        model.setState(nextState);
        model.resolveCollisions(-2, 2, -2, 1.5);
    }

    const state = model.getState();
    expect(state[0]).toBeCloseTo(0, 0.01);
    expect(state[1]).toBeCloseTo(-0.8, 0.01);
  });

  it('settles to a stable state (low average error)', () => {
    const model = new HangingChain({ segments: 8, iterations: 20 });
    const dt = 1/60;
    
    // Simulating many steps to let it settle
    for (let i = 0; i < 300; i++) {
        const deriv = model.derivatives(model.getState());
        const nextState = model.getState().map((v, idx) => v + deriv[idx] * dt);
        model.setState(nextState);
        model.resolveCollisions(-2, 2, -2, 1.5);
    }

    const stats = model.getStats();
    expect(stats.avgError).toBeLessThan(0.01);
  });

  it('prevents NaN in state', () => {
    const model = new HangingChain({ segments: 5 });
    const dt = 1/60;
    for (let i = 0; i < 50; i++) {
        const deriv = model.derivatives(model.getState());
        const nextState = model.getState().map((v, idx) => v + deriv[idx] * dt);
        model.setState(nextState);
        model.resolveCollisions(-2, 2, -2, 1.5);
    }
    const state = model.getState();
    state.forEach(v => expect(Number.isFinite(v)).toBe(true));
  });
});
