import { describe, it, expect } from 'vitest';
import { CurvedObjectDemo } from '../src/simulations/curvedObjectDemo';
import { RigidRollerCoasterDemo } from '../src/simulations/rigidRollerCoasterDemo';
import { StringDemo } from '../src/simulations/stringDemo';
import { PendulumClockDemo } from '../src/simulations/pendulumClockDemo';
import { RigidDoublePendulumDemo } from '../src/simulations/rigidDoublePendulumDemo';

describe('Phase 5 Simulation Models', () => {
    it('CurvedObjectDemo should step without NaN', () => {
        const model = new CurvedObjectDemo(CurvedObjectDemo.getDefaultParams());
        for (let i = 0; i < 60; i++) model.step(0.016);
        const state = model.getState();
        state.forEach((v, idx) => {
            if (!Number.isFinite(v)) {
                console.error(`NaN at index ${idx} in CurvedObjectDemo`);
            }
            expect(Number.isFinite(v)).toBe(true);
        });
    });

    it('RigidRollerCoasterDemo should step and fall without NaN', () => {
        const model = new RigidRollerCoasterDemo(RigidRollerCoasterDemo.getDefaultParams());
        for (let i = 0; i < 60; i++) model.step(0.016);
        const state = model.getState();
        state.forEach((v, idx) => {
            if (!Number.isFinite(v)) {
                console.error(`NaN at index ${idx} in RigidRollerCoasterDemo`);
            }
            expect(Number.isFinite(v)).toBe(true);
        });
    });

    it('StringDemo should maintain stability with constraints', () => {
        const model = new StringDemo(StringDemo.getDefaultParams());
        for (let i = 0; i < 100; i++) model.step(0.016);
        const state = model.getState();
        for (const v of state) expect(Number.isFinite(v)).toBe(true);
    });

    it('PendulumClockDemo should oscillate', () => {
        const model = new PendulumClockDemo(PendulumClockDemo.getDefaultParams());
        const startState = model.getState();
        for (let i = 0; i < 120; i++) model.step(0.016);
        const endState = model.getState();
        // Check that something moved/rotated
        let moved = false;
        for (let i = 0; i < endState.length; i++) {
            if (Math.abs(endState[i] - startState[i]) > 1e-4) { moved = true; break; }
        }
        expect(moved).toBe(true);
        for (const v of endState) expect(Number.isFinite(v)).toBe(true);
    });

    it('RigidDoublePendulumDemo should evolve state', () => {
        const model = new RigidDoublePendulumDemo(RigidDoublePendulumDemo.getDefaultParams());
        const start = model.getState(); // Body 0 is pivot, Body 1 is Bar 1, Body 2 is Bar 2
        for (let i = 0; i < 60; i++) model.step(0.016);
        const end = model.getState();
        // Angle of Bar 1 (state[10]) or Bar 2 (state[16])
        expect(end[10]).not.toBe(start[10]);
    });
});
