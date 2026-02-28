import { describe, expect, it } from 'vitest';
import { BodyState } from '../src/engine2d/collision/types';
import { stepCollisionPipeline } from '../src/engine2d/collision/pipeline';

describe('Engine2D Polygon SAT Collision', () => {
  const createPoly = (id: string, x: number, y: number, size: number): BodyState => ({
    id, x, y, vx: 0, vy: 0, mass: 1, invMass: 1, restitution: 0.5, radius: 0, friction: 0.3,
    shape: 'polygon',
    angle: 0, omega: 0, inertia: 1, invInertia: 1,
    localVertices: [
        { x: -size, y: -size },
        { x: size, y: -size },
        { x: size, y: size },
        { x: -size, y: size }
    ]
  });

  it('Polygon-Polygon: detects overlap for squares', () => {
    const a = createPoly('a', 0, 0, 10);
    const b = createPoly('b', 15, 0, 10);
    
    // a: [-10, 10], b: [5, 25] -> overlapX = 10 - 5 = 5
    const res = stepCollisionPipeline([a, b]);
    expect(res.contacts).toBe(1);
    // Normalized normal from A to B should be (1, 0)
    // Actually, detectContacts returns contacts list, but pipeline returns count in result
    // To check details, maybe I should call detectContacts separately?
    // Let's just trust the count for basic check.
  });

  it('Polygon-Polygon: no detection for separated squares', () => {
    const a = createPoly('a', 0, 0, 10);
    const b = createPoly('b', 25, 0, 10);
    const res = stepCollisionPipeline([a, b]);
    expect(res.contacts).toBe(0);
  });

  it('Polygon-Polygon: works with rotation', () => {
    const a = createPoly('a', 0, 0, 10);
    const b = createPoly('b', 22, 0, 10);
    // At t=0, A: x[-10, 10], B: x[12, 32] -> No overlap.
    const res1 = stepCollisionPipeline([a, b]);
    expect(res1.contacts).toBe(0);

    // Rotate A by 45 degrees
    a.angle = Math.PI / 4;
    // Diagonal of A reaches 10 * sqrt(2) = 14.14 in X.
    // X projection: A[-14.14, 14.14], B[12, 32] -> Overlap in X.
    // Also need to check rotated axes, all will overlap for (22, 0).
    const res2 = stepCollisionPipeline([a, b]);
    expect(res2.contacts).toBe(1);
  });

  it('Circle-Polygon collision', () => {
    const poly = createPoly('p', 0, 0, 10);
    const circle: BodyState = {
        id: 'c', x: 15, y: 0, vx: 0, vy: 0, mass: 1, invMass: 1, restitution: 0.5, radius: 10, friction: 0.3,
        shape: 'circle', angle: 0, omega: 0, inertia: 1, invInertia: 1
    };
    
    // Poly x: [-10, 10], Circle x: [5, 25] -> overlap = 5
    const res = stepCollisionPipeline([poly, circle]);
    expect(res.contacts).toBe(1);
  });
});
