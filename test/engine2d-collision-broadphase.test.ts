import { describe, expect, it } from 'vitest';
import { BodyState } from '../src/engine2d/collision/types';
import { computeCandidates, getBodyAABB } from '../src/engine2d/collision/broadPhase';

describe('Engine2D Broad-phase Performance', () => {
  const dummyBody: BodyState = {
    id: 'b', x: 0, y: 0, vx: 0, vy: 0, mass: 1, invMass: 1, restitution: 0.5, radius: 10, friction: 0.3, shape: 'circle',
    angle: 0, omega: 0, inertia: 1, invInertia: 1
  };

  it('Spatial Hash: detects overlap for two close bodies', () => {
    const b1: BodyState = { ...dummyBody, id: 'b1', x: 0, y: 0 };
    const b2: BodyState = { ...dummyBody, id: 'b2', x: 5, y: 0 };
    const candidates = computeCandidates([b1, b2], 0, { mode: 'spatial-hash' });
    expect(candidates.length).toBe(1);
  });

  it('Spatial Hash vs Uniform Grid: equivalent results', () => {
    const bodies: BodyState[] = [];
    for (let i = 0; i < 20; i++) {
        bodies.push({ ...dummyBody, id: `b${i}`, x: Math.random()*200, y: Math.random()*200 });
    }
    const cand1 = computeCandidates(bodies, 0, { mode: 'uniform-grid', cellSize: 30 });
    const cand2 = computeCandidates(bodies, 0, { mode: 'spatial-hash', cellSize: 30 });
    expect(cand1.length).toBe(cand2.length);
  });

  it('Performance check: N=1000 Spatial Hash', () => {
    const N = 1000;
    const bodies: BodyState[] = [];
    const worldSize = 2000;
    for (let i = 0; i < N; i++) {
       bodies.push({
         ...dummyBody,
         id: `b${i}`,
         x: Math.random() * worldSize,
         y: Math.random() * worldSize,
         radius: 5 + Math.random() * 5
       });
    }
    const bruteForceCount = (N * (N - 1)) / 2;
    const candidates = computeCandidates(bodies, 0, { mode: 'spatial-hash' });
    const candidateCount = candidates.length;
    const reduction = (1 - candidateCount / bruteForceCount) * 100;
    
    console.log(`N=${N}: Brute-force=${bruteForceCount}, Broad-phase(Hash)=${candidateCount}, Reduction=${reduction.toFixed(2)}%`);
    expect(reduction).toBeGreaterThan(95);
  });

  it('Mixed-size scene performance comparison', () => {
    const bodies: BodyState[] = [];
    // 1 big body, many small ones
    bodies.push({ ...dummyBody, id: 'big', x: 500, y: 500, shape: 'aabb', halfW: 400, halfH: 400 });
    for (let i = 0; i < 100; i++) {
        bodies.push({ ...dummyBody, id: `s${i}`, x: 400 + Math.random()*200, y: 400 + Math.random()*200, radius: 2 });
    }

    const candGrid = computeCandidates(bodies, 0, { mode: 'uniform-grid', cellSize: 5 }); // Very small cell size for many buckets
    const candHash = computeCandidates(bodies, 0, { mode: 'spatial-hash', cellSize: 5 });
    
    console.log(`Mixed Scene (cellSize=5): Grid pairs=${candGrid.length}, Hash pairs=${candHash.length}`);
    expect(candHash.length).toBe(candGrid.length);
  });
});
