import { describe, expect, it, beforeEach } from 'vitest';
import { stepCollisionPipeline, clearImpulseCache } from '../src/engine2d/collision/pipeline';
import { Joint } from '../src/engine2d/joints/types';
import { createTestCircle, createTestStatic } from './fixtures/physics-test-utils';

describe('Prismatic Joint Physics', () => {
    beforeEach(() => {
        clearImpulseCache();
    });

    it('should maintain linear axis and zero rotation', () => {
        const a = createTestStatic('static', 0, 0);
        const b = createTestCircle('dynamic', 20, 10);
        const joint: Joint = {
            id: 'j5',
            type: 'prismatic',
            bodyIdA: 'static',
            bodyIdB: 'dynamic',
            localAnchorA: { x: 0, y: 0 },
            localAnchorB: { x: 0, y: 0 },
            localAxisA: { x: 1, y: 0 },
            referenceAngle: 0
        };

        const dt = 1/60;
        for (let i = 0; i < 60; i++) {
            stepCollisionPipeline([a, b], { joints: [joint], dt });
            b.vy += 9.8 * dt;
            b.x += b.vx * dt; b.y += b.vy * dt;
            b.angle += b.omega * dt;
        }

        expect(b.y).toBeCloseTo(0, 0.5);
        expect(b.angle).toBeCloseTo(0, 0.1);
    });

    it('Motor: should drive along axis', () => {
        const a = createTestStatic('static', 0, 0);
        const b = createTestCircle('dynamic', 10, 0);
        const joint: Joint = {
            id: 'j6',
            type: 'prismatic',
            bodyIdA: 'static',
            bodyIdB: 'dynamic',
            localAnchorA: { x: 0, y: 0 },
            localAnchorB: { x: -10, y: 0 },
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

    it('Limit: should clamp translation', () => {
        const a = createTestStatic('static', 0, 0);
        const b = createTestCircle('dynamic', 4, 0);
        b.vx = 20;
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

    it('Hard Limit stabilization', () => {
        const a = createTestStatic('static', 0, 0);
        const b = createTestCircle('dynamic', 10, 0);
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
        for (let i = 0; i < 10; i++) {
            stepCollisionPipeline([a, b], { joints: [joint], dt, positionIterations: 10 });
        }
        expect(b.x).toBeLessThanOrEqual(2.1);
    });

    it('High-Speed Limit Stress', () => {
        const a = createTestStatic('static', 0, 0);
        const b = createTestCircle('dynamic', 0, 0);
        b.vx = 1000;
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
        stepCollisionPipeline([a, b], { joints: [joint], dt, positionIterations: 15 });
        b.x += b.vx * dt;
        
        expect(b.x).toBeLessThan(12.0);
        expect(b.vx).toBeLessThanOrEqual(0);
    });

    it('Extreme Mass Ratio (1:1000)', () => {
        const a = createTestStatic('static', 0, 0);
        const b = createTestCircle('dynamic', 1, 0);
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
            b.vx += 1000 * dt;
            b.x += b.vx * dt;
        }
        expect(b.x).toBeLessThan(6.5); 
    });

    it('long-run high-speed stress stays finite and bounded', () => {
        const a = createTestStatic('static', 0, 0);
        const b = createTestCircle('dynamic', 0, 0);
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
    });
});
