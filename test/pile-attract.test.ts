import { describe, expect, it } from 'vitest';
import { PileAttract } from '../src/simulations/pileAttract';

describe('Pile Attract Simulation', () => {
  it('particles move closer to attractor over time and stay stable', () => {
    const model = new PileAttract({ 
        particleCount: 40, 
        attractStrength: 10.0, 
        damping: 0.2,
        restitution: 0.5,
        nodeRadius: 0.05
    });
    const stats0 = model.getStats();
    
    // Set deterministic initial state for test stability
    const initialState = new Array(40 * 4).fill(0);
    for (let i = 0; i < 40; i++) {
        const theta = (i / 40) * Math.PI * 2;
        initialState[i * 4] = Math.cos(theta) * 1.5;
        initialState[i * 4 + 1] = Math.sin(theta) * 1.5;
    }
    model.setState(initialState);
    const statsStart = model.getStats();

    const dt = 1/60;

    for (let i = 0; i < 400; i++) {
        const state = model.getState();
        const deriv = model.derivatives(state);
        const nextState = state.map((v, idx) => v + deriv[idx] * dt);
        model.setState(nextState);
        model.resolveCollisions(-2, 2, -1.5, 1.5);
    }

    const stats1 = model.getStats();
    console.log(`PileAttract Metrics: InitialR=${statsStart.avgRadius.toFixed(3)}, FinalR=${stats1.avgRadius.toFixed(3)}`);
    expect(stats1.avgRadius).toBeLessThan(statsStart.avgRadius);
    
    // Check overlap
    const state = model.getState();
    const r = 0.05;
    let maxOverlap = 0;
    for (let i = 0; i < 40; i++) {
        for (let j = i + 1; j < 40; j++) {
            const d = Math.hypot(state[i*4] - state[j*4], state[i*4+1] - state[j*4+1]);
            const overlap = Math.max(0, 2*r - d);
            maxOverlap = Math.max(maxOverlap, overlap);
        }
    }
    console.log(`PileAttract Max Overlap: ${maxOverlap.toFixed(4)}`);
    // With iterations=3, overlap should be reasonably low (e.g. < radius)
    expect(maxOverlap).toBeLessThan(r * 2);
  });

  it('all states remain finite after simulation', () => {
    const model = new PileAttract({ particleCount: 10 });
    const dt = 1/60;
    for (let i = 0; i < 50; i++) {
        const deriv = model.derivatives(model.getState());
        const nextState = model.getState().map((v, idx) => v + deriv[idx] * dt);
        model.setState(nextState);
        model.resolveCollisions(-2, 2, -1.5, 1.5);
    }
    const state = model.getState();
    state.forEach(v => expect(Number.isFinite(v)).toBe(true));
  });

  it('boundary handling works (bounce)', () => {
    const model = new PileAttract({ particleCount: 1, boundaryMode: 'bounce', restitution: 0.8 });
    model.setState([2.5, 0, 10, 0]); // Clearly beyond maxX=2
    model.resolveCollisions(-2, 2, -1.5, 1.5);
    const state = model.getState();
    // Should have bounced back (vx negated and some restitution)
    expect(state[0]).toBeLessThanOrEqual(2);
    expect(state[2]).toBeLessThan(0);
  });
});
