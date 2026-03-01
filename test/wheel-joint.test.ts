import { describe, it, expect } from 'vitest';
import { BodyState } from '../src/engine2d/collision/types';
import { WheelJoint } from '../src/engine2d/joints/types';
import { stepCollisionPipeline } from '../src/engine2d/collision/pipeline';

describe('Wheel Joint Physics', () => {
    const createChassis = (id: string, x: number, y: number): BodyState => ({
        id, x, y, vx: 0, vy: 0, angle: 0, omega: 0,
        mass: 1, invMass: 1,
        inertia: 1, invInertia: 1,
        restitution: 0, friction: 0,
        shape: 'circle', radius: 0.1
    });

    const createWheel = (id: string, x: number, y: number): BodyState => ({
        id, x, y, vx: 0, vy: 0, angle: 0, omega: 0,
        mass: 1, invMass: 1,
        inertia: 1, invInertia: 1,
        restitution: 0, friction: 0,
        shape: 'circle', radius: 0.1
    });

    it('Convergence: should pull two bodies together without external forces', () => {
        const bA = createChassis('a', 0, 1.0);
        const bB = createWheel('b', 0, 0.0);
        const bodies = [bA, bB];

        const joint: WheelJoint = {
            id: 'j1',
            type: 'wheel',
            bodyIdA: 'a',
            bodyIdB: 'b',
            localAnchorA: { x: 0, y: 0 },
            localAnchorB: { x: 0, y: 0 },
            localAxisA: { x: 0, y: 1 },
            stiffness: 1000,
            damping: 100
        };

        const dt = 1/60;

        // Run for 2 seconds to ensure settling
        for (let i = 0; i < 120; i++) {
            bA.x += bA.vx * dt; bA.y += bA.vy * dt;
            bB.x += bB.vx * dt; bB.y += bB.vy * dt;

            stepCollisionPipeline(bodies, {
                dt,
                joints: [joint],
                velocityIterations: 10,
                positionIterations: 5
            });
        }

        // They should have moved closer
        const finalDist = Math.abs(bA.y - bB.y);
        expect(finalDist).toBeLessThan(0.2); 
        expect(Math.abs(bA.x)).toBeLessThan(1e-5);
    });

    it('Stability: high motor speed on static body', () => {
        const bA = createChassis('a', 0, 0);
        bA.mass = 0; bA.invMass = 0; bA.invInertia = 0; // Static
        
        const bB = createWheel('b', 0.5, 0);
        const bodies = [bA, bB];

        const joint: WheelJoint = {
            id: 'j1',
            type: 'wheel',
            bodyIdA: 'a',
            bodyIdB: 'b',
            localAnchorA: { x: 0, y: 0 },
            localAnchorB: { x: 0, y: 0 },
            localAxisA: { x: 1, y: 0 }, // Axis X
            motorEnabled: true,
            motorSpeed: 100,
            maxMotorTorque: 50,
            stiffness: 100,
            damping: 10
        };

        const dt = 1/60;
        for (let i = 0; i < 60; i++) {
            bB.x += bB.vx * dt; bB.y += bB.vy * dt;
            bB.angle += bB.omega * dt;
            stepCollisionPipeline(bodies, { dt, joints: [joint], velocityIterations: 10, positionIterations: 5 });
        }

        expect(Number.isFinite(bB.omega)).toBe(true);
        expect(Math.abs(bB.y)).toBeLessThan(0.1); // Constraints should hold
    });
});
