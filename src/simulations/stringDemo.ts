import { BodyState } from '../engine2d/collision/types';
import { stepCollisionPipeline } from '../engine2d/collision/pipeline';
import { createBody } from '../engine2d/collision/bodyFactory';
import { Joint } from '../engine2d/joints/types';
import { SimulationModel, StateVector } from '../core/types';

function createStringBody(id: string, x: number, y: number, r: number) {
    return {
        id, x, y, vx: 0, vy: 0, mass: 0.1, invMass: 10,
        restitution: 0.2, friction: 0.5, shape: 'circle' as const, radius: r,
        angle: 0, omega: 0, inertia: 1, invInertia: 1
    };
}

export interface StringDemoParams {
    gravity: number;
    frequency: number;
    segments: number;
    subSteps: number;
}

export class StringDemo implements SimulationModel {
    private bodies: BodyState[] = [];
    private joints: Joint[] = [];
    private time = 0;
    private params: StringDemoParams;

    getJoints(): Joint[] { return this.joints; }

    constructor(params: StringDemoParams) {
        this.params = { ...params };
        this.reset();
    }

    static getDefaultParams(): StringDemoParams {
        return {
            gravity: 9.8,
            frequency: 60,
            segments: 15,
            subSteps: 8
        };
    }

    reset(): void {
        this.bodies = [];
        this.joints = [];
        this.time = 0;

        const anchor = {
            id: 'anchor', x: 0, y: 5, vx: 0, vy: 0, mass: 0, invMass: 0,
            restitution: 0, friction: 0, shape: 'circle' as const, radius: 0,
            angle: 0, omega: 0, inertia: 0, invInertia: 0
        };
        this.bodies.push(anchor);

        const segmentLen = 0.4;
        let prev = anchor;

        for (let i = 0; i < this.params.segments; i++) {
            const b = createStringBody(`seg-${i}`, 0 + (i + 1) * segmentLen, 5, 0.08);
            this.bodies.push(b);

            this.joints.push({
                id: `joint-${i}`,
                type: 'distance',
                bodyIdA: prev.id,
                bodyIdB: b.id,
                localAnchorA: { x: 0, y: 0 },
                localAnchorB: { x: 0, y: 0 },
                length: segmentLen,
                frequency: this.params.frequency,
                dampingRatio: 0.5
            });
            prev = b;
        }
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

    derivatives(): StateVector {
        return new Array(this.bodies.length * 6).fill(0);
    }

    getTime(): number { return this.time; }
    setTime(t: number): void { this.time = t; }

    getParams(): StringDemoParams { return { ...this.params }; }
    setParams(p: Partial<StringDemoParams>): void { this.params = { ...this.params, ...p }; }

    getBodies(): BodyState[] { return this.bodies; }

    step(dt: number): void {
        const subDt = dt / this.params.subSteps;
        for (let s = 0; s < this.params.subSteps; s++) {
            for (const b of this.bodies) {
                if (b.invMass > 0) {
                    b.vy -= this.params.gravity * subDt;
                    b.x += b.vx * subDt;
                    b.y += b.vy * subDt;
                }
            }
            stepCollisionPipeline(this.bodies, { 
                joints: this.joints, 
                dt: subDt, 
                velocityIterations: 12, 
                positionIterations: 6 
            });

            // Prevent NaN
            for (const b of this.bodies) {
                if (!Number.isFinite(b.x) || !Number.isFinite(b.y)) {
                    this.reset();
                    return;
                }
            }
        }
        this.time += dt;
    }
}
