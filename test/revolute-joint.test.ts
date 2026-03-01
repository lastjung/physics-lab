import { describe, expect, it, beforeEach } from 'vitest';
import { stepCollisionPipeline, clearImpulseCache } from '../src/engine2d/collision/pipeline';
import { Joint } from '../src/engine2d/joints/types';
import { createTestCircle, createTestStatic } from './fixtures/physics-test-utils';

describe('Revolute Joint Physics', () => {
    beforeEach(() => {
        clearImpulseCache();
    });

    it('should maintain anchor point', () => {
        const a = createTestStatic('static', 0, 0);
        const b = createTestCircle('dynamic', 20, 0);
        const joint: Joint = {
            id: 'j2',
            type: 'revolute',
            bodyIdA: 'static',
            bodyIdB: 'dynamic',
            localAnchorA: { x: 0, y: 0 },
            localAnchorB: { x: -20, y: 0 }
        };

        const dt = 1 / 60;
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

    it('Motor: should drive relative angular velocity', () => {
        const a = createTestStatic('static', 0, 0);
        const b = createTestCircle('dynamic', 0, 0);
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

    it('Limit: should clamp relative angle into range', () => {
        const a = createTestStatic('static', 0, 0);
        const b = createTestCircle('dynamic', 0, 0);
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

    it('Static Stability under gravity', () => {
        const a = createTestStatic('static', 0, 0);
        const b = createTestCircle('dynamic', 10, 0);
        const joint: Joint = {
            id: 'j8',
            type: 'revolute',
            bodyIdA: 'static',
            bodyIdB: 'dynamic',
            localAnchorA: { x: 0, y: 0 },
            localAnchorB: { x: -10, y: 0 }
        };

        const dt = 1 / 60;
        for (let i = 0; i < 300; i++) {
            stepCollisionPipeline([a, b], { joints: [joint], dt, positionIterations: 10 });
            b.vy += 9.8 * dt;
            b.vx *= 0.95; b.vy *= 0.95; b.omega *= 0.95; // damping
            b.x += b.vx * dt; b.y += b.vy * dt;
            b.angle += b.omega * dt;
        }

        expect(b.y).toBeGreaterThan(8.0);
        expect(Math.abs(b.x)).toBeLessThan(5.0);
    });

    it('Motor: Torque Saturation', () => {
        const a = createTestStatic('static', 0, 0);
        const b = createTestCircle('dynamic', 0, 0);
        b.inertia = 100;
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
            maxMotorTorque: 2.0
        };

        const dt = 1 / 60;
        for (let i = 0; i < 10; i++) {
            stepCollisionPipeline([a, b], { joints: [joint], dt });
            b.angle += b.omega * dt;
        }

        expect(b.omega).toBeLessThan(0.1);
    });

    it('referenceAngle offset', () => {
        const a = createTestStatic('static', 0, 0);
        const b = createTestCircle('dynamic', 0, 0);
        a.angle = 0;
        b.angle = Math.PI / 2;
        const joint: Joint = {
            id: 'j10',
            type: 'revolute',
            bodyIdA: 'static',
            bodyIdB: 'dynamic',
            localAnchorA: { x: 0, y: 0 },
            localAnchorB: { x: 0, y: 0 },
            referenceAngle: Math.PI / 2,
            limitEnabled: true,
            lowerAngle: -0.1,
            upperAngle: 0.1
        };

        const dt = 1 / 60;
        for (let i = 0; i < 10; i++) {
            stepCollisionPipeline([a, b], { joints: [joint], dt });
        }
        expect(b.angle).toBeCloseTo(Math.PI / 2, 0.01);
    });

    it('long-run motor/limit stress stays finite', () => {
        const a = createTestStatic('static', 0, 0);
        const b = createTestCircle('dynamic', 1, 0);
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
});
