import { describe, expect, it } from 'vitest';
import { BodyState } from '../src/engine2d/collision/types';
import { stepCollisionPipeline } from '../src/engine2d/collision/pipeline';
import { timeOfImpactCircleCircle } from '../src/engine2d/collision/ccd';

describe('Engine2D CCD (Continuous Collision Detection)', () => {
  const dummyCircle: BodyState = {
    id: 'c1', x: 0, y: 0, vx: 0, vy: 0, mass: 1, invMass: 1, restitution: 0.5, radius: 10, friction: 0.3, shape: 'circle',
    angle: 0, omega: 0, inertia: 1, invInertia: 1
  };

  it('timeOfImpactCircleCircle: detects impact for fast moving circle', () => {
    const a: BodyState = { ...dummyCircle, id: 'a', x: 0, y: 0, vx: 0, vy: 0 };
    const b: BodyState = { ...dummyCircle, id: 'b', x: 100, y: 0, vx: -2000, vy: 0 }; // Moving very fast
    
    // Discrete check would miss this if dt=1/60
    // At t=0, dist=100. At t=1/60, b.x = 100 - 2000/60 = 100 - 33.3 = 66.6. Still far.
    // Wait, let's make it even faster to "pass through"
    // At t=0, x=100. At t=1/60, x = 100 - 10000/60 = 100 - 166 = -66. (Passed over x=0)
    b.vx = -10000;
    
    const toi = timeOfImpactCircleCircle(a, b, 1/60);
    expect(toi).not.toBeNull();
    if (toi !== null) {
      expect(toi).toBeGreaterThan(0);
      expect(toi).toBeLessThan(1);
    }
  });

  it('tunneling prevention: CCD detects collision that discrete misses', () => {
    const a: BodyState = { ...dummyCircle, id: 'a', x: 0, y: 0, vx: 0, vy: 0 };
    const b: BodyState = { ...dummyCircle, id: 'b', x: 50, y: 0, vx: -6000, vy: 0 }; 
    const dt = 1/60;

    // Discrete check:
    // Start: x=50, End: x = 50 - 6000/60 = -50.
    // At both points, distance > radius sum (20).
    const bodiesDiscrete = [JSON.parse(JSON.stringify(a)), JSON.parse(JSON.stringify(b))];
    const resDiscrete = stepCollisionPipeline(bodiesDiscrete, { ccd: false, dt });
    expect(resDiscrete.contacts).toBe(0);

    // CCD check:
    const bodiesCCD = [JSON.parse(JSON.stringify(a)), JSON.parse(JSON.stringify(b))];
    const resCCD = stepCollisionPipeline(bodiesCCD, { ccd: true, dt });
    expect(resCCD.ccdEvents).toBeGreaterThan(0);
  });

  const dummyAABB: BodyState = {
    id: 'a1', x: 0, y: 0, vx: 0, vy: 0, mass: 1, invMass: 1, restitution: 0.5, halfW: 10, halfH: 10, friction: 0.3, shape: 'aabb',
    angle: 0, omega: 0, inertia: 1, invInertia: 1, radius: 0
  };

  it('no impact for parallel moving circles', () => {
    const a: BodyState = { ...dummyCircle, id: 'a', x: 0, y: 0, vx: 100, vy: 0 };
    const b: BodyState = { ...dummyCircle, id: 'b', x: 0, y: 50, vx: 100, vy: 0 };
    const toi = timeOfImpactCircleCircle(a, b, 1/60);
    expect(toi).toBeNull();
  });

  it('Circle-AABB tunneling prevention', () => {
    const box: BodyState = { ...dummyAABB, id: 'box', x: 0, y: 0, vx: 0, vy: 0 };
    const circle: BodyState = { ...dummyCircle, id: 'circle', x: 50, y: 0, vx: -6000, vy: 0, radius: 10 };
    const dt = 1/60;

    // Discrete miss check
    const bodiesD = [JSON.parse(JSON.stringify(box)), JSON.parse(JSON.stringify(circle))];
    const resD = stepCollisionPipeline(bodiesD, { ccd: false, dt });
    expect(resD.contacts).toBe(0);

    // CCD hit check
    const bodiesC = [JSON.parse(JSON.stringify(box)), JSON.parse(JSON.stringify(circle))];
    const resC = stepCollisionPipeline(bodiesC, { ccd: true, dt });
    expect(resC.ccdEvents).toBeGreaterThan(0);
  });

  it('AABB-AABB tunneling prevention', () => {
    const box1: BodyState = { ...dummyAABB, id: 'b1', x: 0, y: 0, vx: 0, vy: 0 };
    const box2: BodyState = { ...dummyAABB, id: 'b2', x: 50, y: 0, vx: -6000, vy: 0 };
    const dt = 1/60;

    // Discrete miss check
    const bodiesD = [JSON.parse(JSON.stringify(box1)), JSON.parse(JSON.stringify(box2))];
    const resD = stepCollisionPipeline(bodiesD, { ccd: false, dt });
    expect(resD.contacts).toBe(0);

    // CCD hit check
    const bodiesC = [JSON.parse(JSON.stringify(box1)), JSON.parse(JSON.stringify(box2))];
    const resC = stepCollisionPipeline(bodiesC, { ccd: true, dt });
    expect(resC.ccdEvents).toBeGreaterThan(0);
  });
});
