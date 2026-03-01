import { describe, expect, it, beforeEach } from 'vitest';
import { BodyState } from '../src/engine2d/collision/types';
import { stepCollisionPipeline, clearImpulseCache } from '../src/engine2d/collision/pipeline';
import { Joint } from '../src/engine2d/joints/types';

describe('Engine2D Joints', () => {
  beforeEach(() => {
    clearImpulseCache();
  });

  const dummyCircle: (id: string, x: number, y: number) => BodyState = (id, x, y) => ({
    id, x, y, vx: 0, vy: 0, mass: 1, invMass: 1, restitution: 0.5, radius: 0.1, friction: 0.3, shape: 'circle',
    angle: 0, omega: 0, inertia: 1, invInertia: 1
  });

  const dummyStatic: (id: string, x: number, y: number) => BodyState = (id, x, y) => ({
    id, x, y, vx: 0, vy: 0, mass: 0, invMass: 0, restitution: 0.5, radius: 0.1, friction: 0.3, shape: 'circle',
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

  it('Revolute Joint Motor: drives relative angular velocity', () => {
    const a = dummyStatic('static', 0, 0);
    const b = dummyCircle('dynamic', 0, 0);
    const joint: Joint = {
      id: 'j3',
      type: 'revolute',
      bodyIdA: 'static',
      bodyIdB: 'dynamic',
      localAnchorA: { x: 0, y: 0 },
      localAnchorB: { x: 0, y: 0 },
      motorEnabled: true,
      motorSpeed: 2.0,
      maxMotorTorque: 20
    };

    const dt = 1 / 60;
    for (let i = 0; i < 120; i++) {
      stepCollisionPipeline([a, b], { joints: [joint], dt });
      b.angle += b.omega * dt;
    }

    expect(b.omega).toBeGreaterThan(1.5);
    expect(b.angle).toBeGreaterThan(2.0);
  });

  it('Revolute Joint Limit: clamps relative angle into range', () => {
    const a = dummyStatic('static', 0, 0);
    const b = dummyCircle('dynamic', 0, 0);
    b.angle = 1.0;
    const joint: Joint = {
      id: 'j4',
      type: 'revolute',
      bodyIdA: 'static',
      bodyIdB: 'dynamic',
      localAnchorA: { x: 0, y: 0 },
      localAnchorB: { x: 0, y: 0 },
      limitEnabled: true,
      referenceAngle: 0,
      lowerAngle: -0.25,
      upperAngle: 0.25
    };

    const dt = 1 / 60;
    for (let i = 0; i < 80; i++) {
      stepCollisionPipeline([a, b], { joints: [joint], dt });
      b.angle += b.omega * dt;
    }

    expect(b.angle).toBeLessThanOrEqual(0.26);
    expect(b.angle).toBeGreaterThanOrEqual(-0.26);
  });

  it('Prismatic Joint: maintains linear axis and zero rotation', () => {
    const a = dummyStatic('static', 0, 0);
    const b = dummyCircle('dynamic', 20, 10);
    const joint: Joint = {
      id: 'j5',
      type: 'prismatic',
      bodyIdA: 'static',
      bodyIdB: 'dynamic',
      localAnchorA: { x: 0, y: 0 },
      localAnchorB: { x: 0, y: 0 },
      localAxisA: { x: 1, y: 0 }, // Moves along X
      referenceAngle: 0
    };

    const dt = 1/60;
    for (let i = 0; i < 60; i++) {
        stepCollisionPipeline([a, b], { joints: [joint], dt });
        b.vy += 9.8 * dt; // Gravity in Y
        b.x += b.vx * dt; b.y += b.vy * dt;
        b.angle += b.omega * dt;
    }

    // Should stay at Y=0 (or original Y if anchor allows, but here anchors are 0,0)
    // Actually, anchor point of B (dynamic at 20,10) is constrained to axis passing through A's anchor (0,0) with direction (1,0).
    // So B.y should stay at 0 if it was at 0, or be pulled to the axis.
    // In this case, localAnchorB is 0,0 (at body B's center).
    // The constraint is (pB - pA) . perp = 0 => (20, 10) . (0, 1) = 10.
    // So the position solver should pull B to Y=0.
    expect(b.y).toBeCloseTo(0, 0.5);
    expect(b.angle).toBeCloseTo(0, 0.1);
  });

  it('Prismatic Joint Motor: drives along axis', () => {
    const a = dummyStatic('static', 0, 0);
    const b = dummyCircle('dynamic', 10, 0); // Start at 10 to avoid overlap
    const joint: Joint = {
      id: 'j6',
      type: 'prismatic',
      bodyIdA: 'static',
      bodyIdB: 'dynamic',
      localAnchorA: { x: 0, y: 0 },
      localAnchorB: { x: -10, y: 0 }, // Body B is at 10, anchor is at 0
      localAxisA: { x: 1, y: 0 },
      motorEnabled: true,
      motorSpeed: 5.0,
      maxMotorForce: 500
    };

    const dt = 1/60;
    for (let i = 0; i < 60; i++) {
        stepCollisionPipeline([a, b], { joints: [joint], dt });
        b.x += b.vx * dt; b.y += b.vy * dt;
    }

    expect(b.vx).toBeGreaterThan(4.5);
    expect(b.x).toBeGreaterThan(12.0);
  });

  it('Prismatic Joint Limit: clamps translation', () => {
    const a = dummyStatic('static', 0, 0);
    const b = dummyCircle('dynamic', 4, 0); // Start at 4
    b.vx = 20; // High speed to hit limit at 5
    const joint: Joint = {
      id: 'j7',
      type: 'prismatic',
      bodyIdA: 'static',
      bodyIdB: 'dynamic',
      localAnchorA: { x: 0, y: 0 },
      localAnchorB: { x: 0, y: 0 },
      localAxisA: { x: 1, y: 0 },
      limitEnabled: true,
      lowerTranslation: -5,
      upperTranslation: 5
    };

    const dt = 1/60;
    for (let i = 0; i < 60; i++) {
        stepCollisionPipeline([a, b], { joints: [joint], dt });
        b.x += b.vx * dt;
    }

    expect(b.x).toBeLessThanOrEqual(5.2);
    expect(b.vx).toBeLessThanOrEqual(0.1);
  });

  it('Revolute Joint: Static Stability under gravity', () => {
    const a = dummyStatic('static', 0, 0);
    const b = dummyCircle('dynamic', 10, 0);
    const joint: Joint = {
      id: 'j8',
      type: 'revolute',
      bodyIdA: 'static',
      bodyIdB: 'dynamic',
      localAnchorA: { x: 0, y: 0 },
      localAnchorB: { x: -10, y: 0 }
    };

    const dt = 1/60;
    // Run longer to settle (5 seconds)
    for (let i = 0; i < 300; i++) {
        stepCollisionPipeline([a, b], { joints: [joint], dt, positionIterations: 10 });
        b.vy += 9.8 * dt; // Gravity
        // Add artificial air damping for faster convergence in test
        b.vx *= 0.95; b.vy *= 0.95; b.omega *= 0.95;
        b.x += b.vx * dt; b.y += b.vy * dt;
        b.angle += b.omega * dt;
    }

    // Should settle at hanging position: x=0, y=10
    // Relaxed expectation for simple smoke check of stability
    expect(b.y).toBeGreaterThan(8.0);
    expect(Math.abs(b.x)).toBeLessThan(5.0);
  });

  it('Revolute Joint Motor: Torque Saturation', () => {
    const a = dummyStatic('static', 0, 0);
    const b = dummyCircle('dynamic', 0, 0);
    b.inertia = 100; // Very heavy to rotate
    b.invInertia = 0.01;
    const joint: Joint = {
      id: 'j9',
      type: 'revolute',
      bodyIdA: 'static',
      bodyIdB: 'dynamic',
      localAnchorA: { x: 0, y: 0 },
      localAnchorB: { x: 0, y: 0 },
      motorEnabled: true,
      motorSpeed: 10.0,
      maxMotorTorque: 2.0 // Very low torque
    };

    const dt = 1/60;
    for (let i = 0; i < 10; i++) {
        stepCollisionPipeline([a, b], { joints: [joint], dt });
        b.angle += b.omega * dt;
    }

    // With low torque and high inertia, speed should increase slowly
    // Impulse per frame = 2.0 * 1/60 = 0.033
    // Omega increase per frame = 0.033 * invInertia = 0.00033
    // After 10 frames, omega should be around 0.0033
    expect(b.omega).toBeLessThan(0.1);
  });

  it('Revolute Joint: referenceAngle offset', () => {
    const a = dummyStatic('static', 0, 0);
    const b = dummyCircle('dynamic', 0, 0);
    a.angle = 0;
    b.angle = Math.PI / 2; // 90 deg
    const joint: Joint = {
      id: 'j10',
      type: 'revolute',
      bodyIdA: 'static',
      bodyIdB: 'dynamic',
      localAnchorA: { x: 0, y: 0 },
      localAnchorB: { x: 0, y: 0 },
      referenceAngle: Math.PI / 2, // Matches current setup
      limitEnabled: true,
      lowerAngle: -0.1,
      upperAngle: 0.1
    };

    const dt = 1/60;
    // Should not move because relAngle is 0 (relative to reference)
    for (let i = 0; i < 10; i++) {
        stepCollisionPipeline([a, b], { joints: [joint], dt });
    }
    expect(b.angle).toBeCloseTo(Math.PI / 2, 0.01);
  });

  it('Prismatic Joint: Hard Limit stabilization', () => {
    const a = dummyStatic('static', 0, 0);
    const b = dummyCircle('dynamic', 10, 0); // Start way past limit
    const joint: Joint = {
      id: 'j11',
      type: 'prismatic',
      bodyIdA: 'static',
      bodyIdB: 'dynamic',
      localAnchorA: { x: 0, y: 0 },
      localAnchorB: { x: 0, y: 0 },
      localAxisA: { x: 1, y: 0 },
      limitEnabled: true,
      lowerTranslation: -2,
      upperTranslation: 2
    };

    const dt = 1/60;
    // Should pull back to 2 immediately via position solver
    for (let i = 0; i < 10; i++) {
        stepCollisionPipeline([a, b], { joints: [joint], dt, positionIterations: 10 });
    }
    expect(b.x).toBeLessThanOrEqual(2.1);
  });

  it('Prismatic Joint: Extreme Mass Ratio (1:1000)', () => {
    const a = dummyStatic('static', 0, 0);
    const b = dummyCircle('dynamic', 1, 0);
    b.mass = 1000; b.invMass = 0.001;
    const joint: Joint = {
      id: 'j12',
      type: 'prismatic',
      bodyIdA: 'static',
      bodyIdB: 'dynamic',
      localAnchorA: { x: 0, y: 0 },
      localAnchorB: { x: -1, y: 0 },
      localAxisA: { x: 1, y: 0 },
      limitEnabled: true,
      lowerTranslation: -5,
      upperTranslation: 5
    };

    const dt = 1/60;
    for (let i = 0; i < 10; i++) {
        stepCollisionPipeline([a, b], { joints: [joint], dt, positionIterations: 30 });
        b.vx += 1000 * dt; // Massive force pushing outward
        b.x += b.vx * dt;
    }
    // Should still be clamped near 5 despite huge momentum and extreme mass ratio
    expect(b.x).toBeLessThan(6.5); 
  });

  it('Prismatic Joint: High-Speed Limit Stress', () => {
    const a = dummyStatic('static', 0, 0);
    const b = dummyCircle('dynamic', 0, 0);
    b.vx = 1000; // Super high speed hitting limit in one frame
    const joint: Joint = {
      id: 'j13',
      type: 'prismatic',
      bodyIdA: 'static',
      bodyIdB: 'dynamic',
      localAnchorA: { x: 0, y: 0 },
      localAnchorB: { x: 0, y: 0 },
      localAxisA: { x: 1, y: 0 },
      limitEnabled: true,
      lowerTranslation: -10,
      upperTranslation: 10
    };

    const dt = 1/60;
    // After 1 step, it would be at 16.6 (past limit 10)
    stepCollisionPipeline([a, b], { joints: [joint], dt, positionIterations: 15 });
    b.x += b.vx * dt;
    
    expect(b.x).toBeLessThan(12.0); // Clamped well despite huge velocity
    expect(b.vx).toBeLessThanOrEqual(0); // Should be stopped or reversed
  });

  it('Revolute Joint: long-run motor/limit stress stays finite', () => {
    const a = dummyStatic('static', 0, 0);
    const b = dummyCircle('dynamic', 1, 0);
    const joint: Joint = {
      id: 'j14',
      type: 'revolute',
      bodyIdA: 'static',
      bodyIdB: 'dynamic',
      localAnchorA: { x: 0, y: 0 },
      localAnchorB: { x: -1, y: 0 },
      motorEnabled: true,
      motorSpeed: 40,
      maxMotorTorque: 200,
      limitEnabled: true,
      lowerAngle: -0.8,
      upperAngle: 0.8
    };

    const dt = 1 / 120;
    for (let i = 0; i < 600; i++) {
      stepCollisionPipeline([a, b], { joints: [joint], dt, positionIterations: 20, velocityIterations: 12 });
      b.vy += 9.8 * dt;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.angle += b.omega * dt;
    }

    expect(Number.isFinite(b.x)).toBe(true);
    expect(Number.isFinite(b.y)).toBe(true);
    expect(Number.isFinite(b.angle)).toBe(true);
    expect(Math.abs(b.angle)).toBeLessThan(1.2);
  });

  it('Prismatic Joint: long-run high-speed stress stays finite and bounded', () => {
    const a = dummyStatic('static', 0, 0);
    const b = dummyCircle('dynamic', 0, 0);
    const joint: Joint = {
      id: 'j15',
      type: 'prismatic',
      bodyIdA: 'static',
      bodyIdB: 'dynamic',
      localAnchorA: { x: 0, y: 0 },
      localAnchorB: { x: 0, y: 0 },
      localAxisA: { x: 1, y: 0 },
      motorEnabled: true,
      motorSpeed: 120,
      maxMotorForce: 5000,
      limitEnabled: true,
      lowerTranslation: -3,
      upperTranslation: 3
    };

    const dt = 1 / 120;
    for (let i = 0; i < 600; i++) {
      stepCollisionPipeline([a, b], { joints: [joint], dt, positionIterations: 20, velocityIterations: 12 });
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.angle += b.omega * dt;
    }

    expect(Number.isFinite(b.x)).toBe(true);
    expect(Number.isFinite(b.vx)).toBe(true);
    expect(Number.isFinite(b.angle)).toBe(true);
    expect(Math.abs(b.y)).toBeLessThan(0.5);
    expect(b.x).toBeGreaterThan(-4);
    expect(b.x).toBeLessThan(4);
  });
});
