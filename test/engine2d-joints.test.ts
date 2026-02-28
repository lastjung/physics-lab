import { describe, expect, it } from 'vitest';
import { BodyState } from '../src/engine2d/collision/types';
import { stepCollisionPipeline } from '../src/engine2d/collision/pipeline';
import { Joint } from '../src/engine2d/joints/types';

describe('Engine2D Joints', () => {
  const dummyCircle: (id: string, x: number, y: number) => BodyState = (id, x, y) => ({
    id, x, y, vx: 0, vy: 0, mass: 1, invMass: 1, restitution: 0.5, radius: 10, friction: 0.3, shape: 'circle',
    angle: 0, omega: 0, inertia: 1, invInertia: 1
  });

  const dummyStatic: (id: string, x: number, y: number) => BodyState = (id, x, y) => ({
    id, x, y, vx: 0, vy: 0, mass: 0, invMass: 0, restitution: 0.5, radius: 10, friction: 0.3, shape: 'circle',
    angle: 0, omega: 0, inertia: 0, invInertia: 0
  });

  it('Distance Joint: maintains length between static and dynamic body', () => {
    const a = dummyStatic('static', 0, 0);
    const b = dummyCircle('dynamic', 50, 0);
    const joint: Joint = {
      id: 'j1',
      type: 'distance',
      bodyIdA: 'static',
      bodyIdB: 'dynamic',
      localAnchorA: { x: 0, y: 0 },
      localAnchorB: { x: 0, y: 0 },
      length: 100
    };

    // Step a few times
    const dt = 1/60;
    for (let i = 0; i < 60; i++) {
        stepCollisionPipeline([a, b], { joints: [joint], dt });
        // Add gravity to dynamic
        b.vy += 9.8 * dt; 
        b.x += b.vx * dt; b.y += b.vy * dt;
        b.angle += b.omega * dt;
    }

    const dist = Math.hypot(b.x - a.x, b.y - a.y);
    expect(dist).toBeCloseTo(100, 0.5);
  });

  it('Revolute Joint: maintains anchor point', () => {
    const a = dummyStatic('static', 0, 0);
    const b = dummyCircle('dynamic', 20, 0);
    const joint: Joint = {
      id: 'j2',
      type: 'revolute',
      bodyIdA: 'static',
      bodyIdB: 'dynamic',
      localAnchorA: { x: 0, y: 0 },
      localAnchorB: { x: -20, y: 0 }
    };

    const dt = 1/60;
    for (let i = 0; i < 60; i++) {
        stepCollisionPipeline([a, b], { joints: [joint], dt });
        b.vy += 9.8 * dt;
        b.x += b.vx * dt; b.y += b.vy * dt;
        b.angle += b.omega * dt;
    }

    const bCos = Math.cos(b.angle), bSin = Math.sin(b.angle);
    const wbX = b.x + (-20 * bCos - 0 * bSin);
    const wbY = b.y + (-20 * bSin + 0 * bCos);

    expect(wbX).toBeCloseTo(0, 0.5);
    expect(wbY).toBeCloseTo(0, 0.5);
  });
});
