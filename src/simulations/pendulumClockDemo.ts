import { BodyState } from '../engine2d/collision/types';
import { stepCollisionPipeline } from '../engine2d/collision/pipeline';
import { createBody, createPolygon } from '../engine2d/collision/bodyFactory';
import { Joint } from '../engine2d/joints/types';
import { SimulationModel, StateVector } from '../core/types';

export interface PendulumClockParams {
    gravity: number;
    subSteps: number;
    gearTorque: number;
    motorSpeed: number;
}

export class PendulumClockDemo implements SimulationModel {
    private bodies: BodyState[] = [];
    private joints: Joint[] = [];
    private time = 0;
    private params: PendulumClockParams;

    getJoints(): Joint[] { return this.joints; }

    constructor(params: PendulumClockParams) {
        this.params = { ...params };
        this.reset();
    }

    static getDefaultParams(): PendulumClockParams {
        return {
            gravity: 9.8,
            subSteps: 12,
            gearTorque: 15.0,
            motorSpeed: 0.15
        };
    }

    reset(): void {
        this.bodies = [];
        this.joints = [];
        this.time = 0;

        const anchor = {
            id: 'clock-anchor', x: 0, y: 0, vx: 0, vy: 0, mass: 0, invMass: 0,
            restitution: 0, friction: 0, shape: 'circle' as const, radius: 0,
            angle: 0, omega: 0, inertia: 0, invInertia: 0
        };
        this.bodies.push(anchor);

        // Pendulum rod hangs DOWN from anchor at y=5
        const pendulumVerts = [
            { x: -0.08, y: 0 },
            { x: 0.08, y: 0 },
            { x: 0.08, y: -4.0 },
            { x: -0.08, y: -4.0 }
        ];
        const pendulum = createPolygon('pendulum', pendulumVerts);
        pendulum.x = 0;
        pendulum.y = 6.0;
        this.bodies.push(pendulum);

        // Latch at the top of the pendulum
        const latchVerts = [
            { x: -0.6, y: 0 },
            { x: 0.6, y: 0 },
            { x: 0.5, y: 0.3 },
            { x: -0.5, y: 0.3 }
        ];
        const latch = createPolygon('latch', latchVerts);
        latch.x = 0;
        latch.y = 6.0;
        this.bodies.push(latch);

        this.joints.push({
            id: 'pendulum-anchor',
            type: 'revolute',
            bodyIdA: 'clock-anchor',
            bodyIdB: 'pendulum',
            localAnchorA: { x: 0, y: 6 },
            localAnchorB: { x: 0, y: 0 }
        });
        this.joints.push({
            id: 'latch-to-pendulum',
            type: 'weld',
            bodyIdA: 'pendulum',
            bodyIdB: 'latch',
            localAnchorA: { x: 0, y: 0 },
            localAnchorB: { x: 0, y: 0 },
            referenceAngle: 0
        });
        latch.angle = 0.3;

        // Gear wheel next to the pendulum pivot
        const gearVerts: {x:number, y:number}[] = [];
        const teeth = 12;
        const rOuter = 1.5;
        const rInner = 1.2;
        for (let i = 0; i < teeth; i++) {
            const ang = (i / teeth) * Math.PI * 2;
            const ang2 = ((i + 0.5) / teeth) * Math.PI * 2;
            gearVerts.push({ x: Math.cos(ang) * rOuter, y: Math.sin(ang) * rOuter });
            gearVerts.push({ x: Math.cos(ang2) * rInner, y: Math.sin(ang2) * rInner });
        }
        const gear = createPolygon('gear', gearVerts);
        gear.x = 4.0;
        gear.y = 6.0;
        this.bodies.push(gear);

        this.joints.push({
            id: 'gear-anchor',
            type: 'revolute',
            bodyIdA: 'clock-anchor',
            bodyIdB: 'gear',
            localAnchorA: { x: 4, y: 6 },
            localAnchorB: { x: 0, y: 0 },
            motorEnabled: true,
            motorSpeed: this.params.motorSpeed,
            maxMotorTorque: this.params.gearTorque
        });

        pendulum.angle = 0.3;
    }

    getState(): StateVector {
        const state: number[] = [];
        for (const b of this.bodies) {
            state.push(b.x, b.y, b.vx, b.vy, b.angle, b.omega);
        }
        return state;
    }

    setState(next: StateVector): void {
        let cursor = 0;
        for (const b of this.bodies) {
            b.x = next[cursor++];
            b.y = next[cursor++];
            b.vx = next[cursor++];
            b.vy = next[cursor++];
            b.angle = next[cursor++];
            b.omega = next[cursor++];
        }
    }

    derivatives(): StateVector { return new Array(this.bodies.length * 6).fill(0); }
    getTime(): number { return this.time; }
    setTime(t: number): void { this.time = t; }

    getParams(): PendulumClockParams { return { ...this.params }; }
    setParams(p: Partial<PendulumClockParams>): void { this.params = { ...this.params, ...p }; }

    getBodies(): BodyState[] { return this.bodies; }

    step(dt: number): void {
        const subDt = dt / this.params.subSteps;
        for (let s = 0; s < this.params.subSteps; s++) {
            for (const b of this.bodies) {
                if (b.invMass > 0) {
                    b.vy -= this.params.gravity * subDt;
                    b.x += b.vx * subDt;
                    b.y += b.vy * subDt;
                    b.angle += b.omega * subDt;
                    // Angular damping to prevent runaway rotation
                    b.omega *= 0.995;
                    b.vx *= 0.999;
                    b.vy *= 0.999;
                }
            }

            // Sync world vertices
            for (const b of this.bodies) {
                if (b.shape === 'polygon' && b.localVertices) {
                    const c = Math.cos(b.angle), s = Math.sin(b.angle);
                    b.worldVertices = b.localVertices.map(v => ({
                        x: b.x + (v.x * c - v.y * s), y: b.y + (v.x * s + v.y * c)
                    }));
                }
            }

            stepCollisionPipeline(this.bodies, { 
                joints: this.joints, 
                dt: subDt, 
                velocityIterations: 12, 
                positionIterations: 6 
            });

            // Directly enforce gear speed limit
            const gear = this.bodies.find(b => b.id === 'gear');
            if (gear) {
                const maxSpeed = this.params.motorSpeed;
                if (Math.abs(gear.omega) > maxSpeed) {
                    gear.omega = Math.sign(gear.omega) * maxSpeed;
                }
            }
        }
        this.time += dt;
    }
}
