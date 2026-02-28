import { describe, expect, it, beforeEach } from 'vitest';
import { detectContacts, stepCollisionPipeline, clearImpulseCache } from '../src/engine2d/collision/pipeline';
import { BodyState } from '../src/engine2d/collision/types';

describe('Engine2D Collision Pipeline', () => {
  const dummyBody: BodyState = {
    id: 'b1', x: 0, y: 0, vx: 0, vy: 0, mass: 1, invMass: 1, restitution: 0.5, radius: 10, friction: 0.3, shape: 'circle',
    angle: 0, omega: 0, inertia: 1, invInertia: 1
  };

  beforeEach(() => {
    clearImpulseCache();
  });

  it('detectContacts returns an array and no NaN in dummy call', () => {
    const contacts = detectContacts([dummyBody]);
    expect(Array.isArray(contacts)).toBe(true);
  });

  it('no contacts for non-overlapping bodies', () => {
    const b1: BodyState = { ...dummyBody, id: 'b1', x: 0, y: 0, radius: 10, shape: 'circle' };
    const b2: BodyState = { ...dummyBody, id: 'b2', x: 25, y: 0, radius: 10, shape: 'circle' }; // dist=25 > 20
    const contacts = detectContacts([b1, b2]);
    expect(contacts.length).toBe(0);
  });

  it('one contact for overlapping bodies with correct penetration', () => {
    const b1: BodyState = { ...dummyBody, id: 'b1', x: 0, y: 0, radius: 10, shape: 'circle' };
    const b2: BodyState = { ...dummyBody, id: 'b2', x: 15, y: 0, radius: 10, shape: 'circle' }; // dist=15 < 20
    const contacts = detectContacts([b1, b2]);
    expect(contacts.length).toBe(1);
    expect(contacts[0].points[0].penetration).toBeCloseTo(5); // 20 - 15 = 5
    expect(contacts[0].nx).toBeCloseTo(1);
    expect(contacts[0].ny).toBeCloseTo(0);
  });

  it('handles perfectly overlapping bodies (dist=0) without NaN', () => {
    const b1: BodyState = { ...dummyBody, id: 'b1', x: 50, y: 50, radius: 10, shape: 'circle' };
    const b2: BodyState = { ...dummyBody, id: 'b2', x: 50, y: 50, radius: 10, shape: 'circle' };
    const contacts = detectContacts([b1, b2]);
    expect(contacts.length).toBe(1);
    expect(Number.isFinite(contacts[0].nx)).toBe(true);
    expect(Number.isFinite(contacts[0].ny)).toBe(true);
    expect(contacts[0].points[0].penetration).toBe(20);
  });

  it('returned impulse and correction are non-negative', () => {
    const result = stepCollisionPipeline([dummyBody]);
    expect(result.impulse).toBeGreaterThanOrEqual(0);
    expect(result.correction).toBeGreaterThanOrEqual(0);
  });

  it('elastic collision (e=1) swaps velocities for same mass', () => {
    const b1: BodyState = { ...dummyBody, id: 'b1', x: 0, y: 0, vx: 5, vy: 0, mass: 1, invMass: 1, restitution: 1, friction: 0, shape: 'circle' };
    const b2: BodyState = { ...dummyBody, id: 'b2', x: 15, y: 0, vx: -2, vy: 0, mass: 1, invMass: 1, restitution: 1, friction: 0, shape: 'circle' };
    // collision check: 15 < 20 (radius 10 each)
    const result = stepCollisionPipeline([b1, b2], { velocityIterations: 1, positionIterations: 1, warmStart: false });
    // check new velocities in original objects (mutation occurs in current setup)
    expect(b1.vx).toBeCloseTo(-2);
    expect(b2.vx).toBeCloseTo(5);
    expect(result.impulse).toBeGreaterThan(0);
  });

  it('inelastic collision (e=0) results in zero relative normal velocity', () => {
    const b1: BodyState = { ...dummyBody, id: 'b1', x: 0, y: 0, vx: 10, vy: 0, restitution: 0, friction: 0, shape: 'circle' };
    const b2: BodyState = { ...dummyBody, id: 'b2', x: 15, y: 0, vx: 0, vy: 0, restitution: 0, friction: 0, shape: 'circle' };
    stepCollisionPipeline([b1, b2], { velocityIterations: 1, positionIterations: 1, warmStart: false });
    const relVel = b2.vx - b1.vx;
    expect(relVel).toBeCloseTo(0);
  });

  it('no impulse if bodies are already separating', () => {
    const b1: BodyState = { ...dummyBody, id: 'b1', x: 0, y: 0, vx: -5, vy: 0, friction: 0, shape: 'circle' };
    const b2: BodyState = { ...dummyBody, id: 'b2', x: 15, y: 0, vx: 5, vy: 0, friction: 0, shape: 'circle' };
    const result = stepCollisionPipeline([b1, b2], { velocityIterations: 1, positionIterations: 1, warmStart: false });
    expect(result.impulse).toBe(0);
    expect(b1.vx).toBe(-5);
    expect(b2.vx).toBe(5);
  });

  it('stabilization increases distance between overlapping bodies', () => {
    const b1: BodyState = { ...dummyBody, id: 'b1', x: 0, y: 0, radius: 10, shape: 'circle' };
    const b2: BodyState = { ...dummyBody, id: 'b2', x: 15, y: 0, radius: 10, shape: 'circle' };
    const distBefore = Math.abs(b2.x - b1.x);
    const result = stepCollisionPipeline([b1, b2]);
    const distAfter = Math.abs(b2.x - b1.x);
    expect(distAfter).toBeGreaterThan(distBefore);
    expect(result.correction).toBeGreaterThan(0);
  });

  it('stabilization handles static bodies (invMass=0)', () => {
    const staticBody: BodyState = { ...dummyBody, id: 'static', x: 0, y: 0, radius: 10, invMass: 0, mass: Infinity, shape: 'circle' };
    const dynamicBody: BodyState = { ...dummyBody, id: 'dynamic', x: 15, y: 0, radius: 10, invMass: 1, mass: 1, shape: 'circle' };
    const staticXBefore = staticBody.x;
    const dynamicXBefore = dynamicBody.x;
    stepCollisionPipeline([staticBody, dynamicBody]);
    expect(staticBody.x).toBe(staticXBefore);
    expect(dynamicBody.x).toBeGreaterThan(dynamicXBefore);
  });

  it('no correction if penetration is within slop (0.01)', () => {
    const b1: BodyState = { ...dummyBody, id: 'b1', x: 0, y: 0, radius: 10, shape: 'circle' };
    const b2: BodyState = { ...dummyBody, id: 'b2', x: 19.995, y: 0, radius: 10, shape: 'circle' }; // penetration = 0.005 < 0.01
    const result = stepCollisionPipeline([b1, b2]);
    expect(result.correction).toBe(0);
  });

  it('reflects iterations count in output', () => {
    const result = stepCollisionPipeline([dummyBody], { iterations: 10 });
    expect(result.velocityIterations).toBe(10);
  });

  it('clamps iterations to minimum of 1', () => {
    const result = stepCollisionPipeline([dummyBody], { iterations: 0 });
    expect(result.velocityIterations).toBe(1);
    const resultNeg = stepCollisionPipeline([dummyBody], { iterations: -5 });
    expect(resultNeg.velocityIterations).toBe(1);
  });

  it('higher iterations result in lower final penetration', () => {
    const createBodies = () => [
      { ...dummyBody, id: 'b1', x: 0, y: 0, radius: 10, invMass: 1, shape: 'circle' as const },
      { ...dummyBody, id: 'b2', x: 15, y: 0, radius: 10, invMass: 1, shape: 'circle' as const }
    ];

    const bodies1 = createBodies();
    stepCollisionPipeline(bodies1, { iterations: 1 });
    const pen1 = 20 - Math.hypot(bodies1[1].x - bodies1[0].x, bodies1[1].y - bodies1[0].y);

    const bodies8 = createBodies();
    stepCollisionPipeline(bodies8, { iterations: 8 });
    const pen8 = 20 - Math.hypot(bodies8[1].x - bodies8[0].x, bodies8[1].y - bodies8[0].y);

    expect(pen8).toBeLessThan(pen1);
    console.log(`Penetration with iter=1: ${pen1}`);
    console.log(`Penetration with iter=8: ${pen8}`);
  });

  it('friction reduces tangential velocity', () => {
    const b1: BodyState = { ...dummyBody, id: 'floor', x: 0, y: 10, vx: 0, vy: 0, invMass: 0, friction: 0.5, radius: 10, shape: 'circle' };
    const b2: BodyState = { ...dummyBody, id: 'slider', x: 0, y: -9.5, vx: 10, vy: 5, invMass: 1, friction: 0.5, radius: 10, shape: 'circle' };
    
    const vxBefore = b2.vx;
    stepCollisionPipeline([b1, b2], { iterations: 1 });
    
    console.log(`vx before friction: ${vxBefore}, after: ${b2.vx}`);
    expect(Math.abs(b2.vx)).toBeLessThan(vxBefore);
  });

  it('friction=0 does not change tangential velocity', () => {
    const b1: BodyState = { ...dummyBody, id: 'floor', x: 0, y: 20, invMass: 0, friction: 0, radius: 10, shape: 'circle' };
    const b2: BodyState = { ...dummyBody, id: 'slider', x: 0, y: 1, vx: 10, vy: 0, invMass: 1, friction: 0, radius: 10, shape: 'circle' };
    stepCollisionPipeline([b1, b2], { iterations: 1 });
    expect(b2.vx).toBe(10);
  });

  it('warm starting saves and reuses impulses across frames', () => {
    const b1: BodyState = { ...dummyBody, id: 'floor', x: 0, y: 10, vy: 0, invMass: 0, radius: 10, shape: 'circle' };
    const b2: BodyState = { ...dummyBody, id: 'slider', x: 0, y: -9, vy: 5, invMass: 1, radius: 10, shape: 'circle' };
    
    const res1 = stepCollisionPipeline([b1, b2], { iterations: 4, warmStart: true });
    expect(res1.warmStartedContacts).toBe(0);

    const res2 = stepCollisionPipeline([b1, b2], { iterations: 4, warmStart: true });
    expect(res2.warmStartedContacts).toBe(1);
  });

  it('warm start cache is cleaned up when contacts break', () => {
    const b1: BodyState = { ...dummyBody, id: 'b1', x: 0, y: 0, radius: 10, shape: 'circle' };
    const b2: BodyState = { ...dummyBody, id: 'b2', x: 15, y: 0, radius: 10, shape: 'circle' };
    
    stepCollisionPipeline([b1, b2], { iterations: 1, warmStart: true });

    b2.x = 100;
    const res2 = stepCollisionPipeline([b1, b2], { iterations: 1, warmStart: true });
    expect(res2.contacts).toBe(0);

    b2.x = 15;
    const res3 = stepCollisionPipeline([b1, b2], { iterations: 1, warmStart: true });
    expect(res3.warmStartedContacts).toBe(0);
  });

  it('warm starting leads to faster or equal convergence', () => {
    const create = () => [
      { ...dummyBody, id: 'b1', x: 0, y: 0, radius: 10, invMass: 0, shape: 'circle' as const },
      { ...dummyBody, id: 'b2', x: 0, y: 15, radius: 10, invMass: 1, vy: -10, shape: 'circle' as const } 
    ];

    const coldBodies = create();
    stepCollisionPipeline(coldBodies, { iterations: 1, warmStart: false });
    stepCollisionPipeline(coldBodies, { iterations: 1, warmStart: false });
    const penCold = 20 - Math.abs(coldBodies[1].y - coldBodies[0].y);

    const warmBodies = create();
    stepCollisionPipeline(warmBodies, { iterations: 1, warmStart: true });
    stepCollisionPipeline(warmBodies, { iterations: 1, warmStart: true });
    const penWarm = 20 - Math.abs(warmBodies[1].y - warmBodies[0].y);

    expect(penWarm).toBeLessThanOrEqual(penCold);
  });

  it('Circle-AABB: no contact when separated', () => {
    const circle: BodyState = { ...dummyBody, id: 'c1', x: 0, y: 0, radius: 10, shape: 'circle' };
    const box: BodyState = { ...dummyBody, id: 'b1', x: 30, y: 0, halfW: 10, halfH: 10, shape: 'aabb' };
    const contacts = detectContacts([circle, box]);
    expect(contacts.length).toBe(0);
  });

  it('Circle-AABB: contact when hitting side edge', () => {
    const circle: BodyState = { ...dummyBody, id: 'c1', x: 0, y: 0, radius: 10, shape: 'circle' };
    const box: BodyState = { ...dummyBody, id: 'b1', x: 18, y: 0, halfW: 5, halfH: 5, shape: 'aabb' };
    // Box x-range: 13 to 23. Circle right edge at 10. Closest is (13, 0). Dist = 13.
    // Penetration = 10 - 13 = -3 (Wait, 18-5 = 13. dist between (0,0) and (13,0) is 13. Radius 10.) 
    // Let's adjust: circle at 5, box center at 18, halfW 5. Box boundary at 13. Circle right at 15.
    circle.x = 5;
    const contacts = detectContacts([circle, box]);
    expect(contacts.length).toBe(1);
    expect(contacts[0].points[0].penetration).toBeCloseTo(2); // (5+10) - 13 = 2
    expect(contacts[0].nx).toBeCloseTo(1);
    expect(contacts[0].ny).toBeCloseTo(0);
  });

  it('Circle-AABB: contact when center is inside box', () => {
    const circle: BodyState = { ...dummyBody, id: 'c1', x: 18, y: 0, radius: 10, shape: 'circle' };
    const box: BodyState = { ...dummyBody, id: 'b1', x: 18, y: 0, halfW: 5, halfH: 5, shape: 'aabb' };
    const contacts = detectContacts([circle, box]);
    expect(contacts.length).toBe(1);
    expect(contacts[0].points[0].penetration).toBeGreaterThan(10); // radius(10) + distance to edge(5)
    expect(Number.isFinite(contacts[0].nx)).toBe(true);
    expect(Number.isFinite(contacts[0].ny)).toBe(true);
  });

  it('AABB-AABB: no contact when separated', () => {
    const b1: BodyState = { ...dummyBody, id: 'b1', x: 0, y: 0, halfW: 10, halfH: 10, shape: 'aabb' };
    const b2: BodyState = { ...dummyBody, id: 'b2', x: 25, y: 0, halfW: 10, halfH: 10, shape: 'aabb' };
    const contacts = detectContacts([b1, b2]);
    expect(contacts.length).toBe(0);
  });

  it('AABB-AABB: contact on X-axis overlap', () => {
    const b1: BodyState = { ...dummyBody, id: 'b1', x: 0, y: 0, halfW: 10, halfH: 10, shape: 'aabb' };
    const b2: BodyState = { ...dummyBody, id: 'b2', x: 15, y: 0, halfW: 10, halfH: 10, shape: 'aabb' };
    const contacts = detectContacts([b1, b2]);
    expect(contacts.length).toBe(1);
    expect(contacts[0].nx).toBeCloseTo(1);
    expect(contacts[0].ny).toBe(0);
    expect(contacts[0].points[0].penetration).toBeCloseTo(5); // (10+10) - 15 = 5
  });

  it('AABB-AABB: contact on Y-axis overlap', () => {
    const b1: BodyState = { ...dummyBody, id: 'b1', x: 0, y: 0, halfW: 10, halfH: 10, shape: 'aabb' };
    const b2: BodyState = { ...dummyBody, id: 'b2', x: 0, y: 18, halfW: 10, halfH: 10, shape: 'aabb' };
    const contacts = detectContacts([b1, b2]);
    expect(contacts.length).toBe(1);
    expect(contacts[0].nx).toBe(0);
    expect(contacts[0].ny).toBeCloseTo(1);
    expect(contacts[0].points[0].penetration).toBeCloseTo(2); // (10+10) - 18 = 2
  });

  it('AABB-AABB: face-to-face generates 2 contact points', () => {
    const b1: BodyState = { ...dummyBody, id: 'b1', x: 0, y: 0, halfW: 10, halfH: 10, shape: 'aabb' };
    const b2: BodyState = { ...dummyBody, id: 'b2', x: 0, y: 15, halfW: 10, halfH: 10, shape: 'aabb' };
    const contacts = detectContacts([b1, b2]);
    expect(contacts.length).toBe(1);
    expect(contacts[0].points.length).toBe(2);
    expect(contacts[0].points[0].penetration).toBeGreaterThan(0);
    expect(contacts[0].points[1].penetration).toBeGreaterThan(0);
  });

  it('Stacking: 3-layer box stack remains stable over 120 frames', () => {
    // Floor, Box1 (on floor), Box2 (on Box1)
    const floor: BodyState = { ...dummyBody, id: 'floor', x: 0, y: 10, halfW: 100, halfH: 10, invMass: 0, shape: 'aabb' as const };
    const box1: BodyState = { ...dummyBody, id: 'box1', x: 0, y: -9.5, halfW: 10, halfH: 10, invMass: 1, shape: 'aabb' as const };
    const box2: BodyState = { ...dummyBody, id: 'box2', x: 0, y: -30, halfW: 10, halfH: 10, invMass: 1, shape: 'aabb' as const, vy: 5 }; // Falling onto box1

    // Run 120 frames
    for (let i = 0; i < 120; i++) {
      // Simulate gravity manually for stability test
      box1.vy += 0.1;
      box2.vy += 0.1;
      // Simple Euler integration for position
      box1.y += box1.vy * (1/60);
      box2.y += box2.vy * (1/60);
      
      stepCollisionPipeline([floor, box1, box2], { velocityIterations: 8, positionIterations: 6 });
    }

    const contacts = detectContacts([floor, box1, box2]);
    let avgPen = 0;
    if (contacts.length > 0) {
      avgPen = contacts.reduce((s, c) => s + c.points.reduce((ps, p) => ps + p.penetration, 0) / c.points.length, 0) / contacts.length;
    }
    
    console.log(`Average penetration after 120 frames: ${avgPen}`);
    // Should be reasonably small
    expect(avgPen).toBeLessThan(0.1);
  });

  it('tuning positionIterations decreases penetration monotonically', () => {
    const create = () => [
      { ...dummyBody, id: 'b1', x: 0, y: 0, radius: 10, invMass: 0, shape: 'circle' as const },
      { ...dummyBody, id: 'b2', x: 0, y: 15, radius: 10, invMass: 1, shape: 'circle' as const }
    ];

    const b1 = create();
    stepCollisionPipeline(b1, { positionIterations: 1 });
    const pen1 = 20 - Math.abs(b1[1].y - b1[0].y);

    const b10 = create();
    stepCollisionPipeline(b10, { positionIterations: 10 });
    const pen10 = 20 - Math.abs(b10[1].y - b10[0].y);

    expect(pen10).toBeLessThan(pen1);
  });

  it('beta and slop parameters affect stabilization results', () => {
    const create = () => [
      { ...dummyBody, id: 'b1', x: 0, y: 0, radius: 10, invMass: 0, shape: 'circle' as const },
      { ...dummyBody, id: 'b2', x: 0, y: 15, radius: 10, invMass: 1, shape: 'circle' as const }
    ];

    const lowBeta = create();
    stepCollisionPipeline(lowBeta, { positionIterations: 1, beta: 0.1, slop: 0 });
    const penLow = 20 - Math.abs(lowBeta[1].y - lowBeta[0].y);

    const highBeta = create();
    stepCollisionPipeline(highBeta, { positionIterations: 1, beta: 0.9, slop: 0 });
    const penHigh = 20 - Math.abs(highBeta[1].y - highBeta[0].y);

    // Higher beta should push further
    expect(penHigh).toBeLessThan(penLow);
  });

  it('Rotation: off-center collision generates omega', () => {
    // Circle at (0,0) static. Circle at (15, 5) moving left.
    // Collision near top of circle at (0,0).
    const staticBody: BodyState = { ...dummyBody, id: 'static', x: 0, y: 0, invMass: 0, invInertia: 0, shape: 'circle' };
    const bullet: BodyState = { ...dummyBody, id: 'bullet', x: 10, y: 4, vx: -10, vy: 0, invMass: 1, invInertia: 1, radius: 2, shape: 'circle' };
    
    expect(bullet.omega).toBe(0);
    stepCollisionPipeline([staticBody, bullet], { velocityIterations: 1 });
    console.log(`Bullet omega after off-center hit: ${bullet.omega}`);
    expect(bullet.omega).not.toBe(0);
  });

  it('Rotation: central collision generates near-zero omega change', () => {
    const b1: BodyState = { ...dummyBody, id: 'b1', x: 0, y: 0, vx: 10, vy: 0, shape: 'circle' };
    const b2: BodyState = { ...dummyBody, id: 'b2', x: 15, y: 0, vx: 0, vy: 0, shape: 'circle' };
    
    stepCollisionPipeline([b1, b2], { iterations: 1 });
    expect(Math.abs(b1.omega)).toBeLessThan(1e-9);
    expect(Math.abs(b2.omega)).toBeLessThan(1e-9);
  });

  it('Rotation: Manifold vs Single Point stability (Stacking with rotation)', () => {
    // Simple 2-box test where one is slightly offset to test "tilting"
    const floor: BodyState = { ...dummyBody, id: 'floor', x: 0, y: 10, halfW: 100, halfH: 10, invMass: 0, invInertia: 0, shape: 'aabb' as const };
    const box1: BodyState = { ...dummyBody, id: 'box1', x: 0, y: -9.5, halfW: 10, halfH: 10, invMass: 1, invInertia: 1, shape: 'aabb' as const };
    
    // Simulate 10 frames
    for (let i = 0; i < 10; i++) {
       box1.vy += 0.1;
       box1.y += box1.vy * (1/60);
       stepCollisionPipeline([floor, box1]);
    }

    // With 2-point manifold, omega should stay near 0 for a centered box on a flat floor
    console.log(`Box1 omega after centered stack: ${box1.omega}`);
    expect(Math.abs(box1.omega)).toBeLessThan(1e-3);
  });
});
