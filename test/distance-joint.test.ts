import { describe, expect, it, beforeEach } from 'vitest';
import { stepCollisionPipeline, clearImpulseCache } from '../src/engine2d/collision/pipeline';
import { Joint } from '../src/engine2d/joints/types';
import { createTestCircle, createTestStatic } from './fixtures/physics-test-utils';

describe('Distance Joint Physics', () => {
    beforeEach(() => {
        clearImpulseCache();
    });

    it('should maintain length between static and dynamic body', () => {
        const a = createTestStatic('static', 0, 0);
        const b = createTestCircle('dynamic', 50, 0);
        const joint: Joint = {
            id: 'j1',
            type: 'distance',
            bodyIdA: 'static',
            bodyIdB: 'dynamic',
            localAnchorA: { x: 0, y: 0 },
            localAnchorB: { x: 0, y: 0 },
            length: 100
        };

        const dt = 1 / 60;
        for (let i = 0; i < 60; i++) {
            stepCollisionPipeline([a, b], { joints: [joint], dt });
            b.vy += 9.8 * dt;
            b.x += b.vx * dt; b.y += b.vy * dt;
        }

        const dist = Math.hypot(b.x - a.x, b.y - a.y);
        expect(dist).toBeCloseTo(100, 0.5);
    });
});
