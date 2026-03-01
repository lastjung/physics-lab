import { BodyState } from '../engine2d/collision/types';
import { stepCollisionPipeline } from '../engine2d/collision/pipeline';
import { createBody, createPolygon } from '../engine2d/collision/bodyFactory';
import { Joint } from '../engine2d/joints/types';
import { SimulationModel, StateVector } from '../core/types';

export interface RigidDoublePendulumParams {
    gravity: number;
    subSteps: number;
    damping: number;
    l1: number;
    l2: number;
    m1: number;
    m2: number;
}

export class RigidDoublePendulumDemo implements SimulationModel {
    private bodies: BodyState[] = [];
    private joints: Joint[] = [];
    private time = 0;
    private params: RigidDoublePendulumParams;

    getJoints(): Joint[] { return this.joints; }

    constructor(params: RigidDoublePendulumParams) {
        this.params = { ...params };
        this.reset();
    }

    static getDefaultParams(): RigidDoublePendulumParams {
        return {
            gravity: 9.8,
            subSteps: 10,
            damping: 0.02,
            l1: 2.0,
            l2: 2.0,
            m1: 1.0,
            m2: 1.0
        };
    }

    reset(): void {
        this.bodies = [];
        this.joints = [];
        this.time = 0;

        const anchor = {
            id: 'pivot', x: 0, y: 3, vx: 0, vy: 0, mass: 0, invMass: 0,
            restitution: 0, friction: 0, shape: 'circle' as const, radius: 0,
            angle: 0, omega: 0, inertia: 0, invInertia: 0
        };
        this.bodies.push(anchor);

        const w1 = 0.2;
        const b1Verts = [
            { x: -w1/2, y: 0.1 },
            { x: w1/2, y: 0.1 },
            { x: w1/2, y: -this.params.l1 - 0.1 },
            { x: -w1/2, y: -this.params.l1 - 0.1 }
        ];
        const bar1 = createPolygon('bar1', b1Verts, { restitution: 0.1, friction: 0.2 });
        bar1.y = 3; 
        bar1.mass = this.params.m1;
        bar1.invMass = 1 / bar1.mass;
        this.bodies.push(bar1);

        const b2Verts = [
            { x: -w1/2, y: 0.1 },
            { x: w1/2, y: 0.1 },
            { x: w1/2, y: -this.params.l2 - 0.1 },
            { x: -w1/2, y: -this.params.l2 - 0.1 }
        ];
        const bar2 = createPolygon('bar2', b2Verts, { restitution: 0.1, friction: 0.2 });
        bar2.y = 3 - this.params.l1;
        bar2.mass = this.params.m2;
        bar2.invMass = 1 / bar2.mass;
        this.bodies.push(bar2);

        this.joints.push({
            id: `rev1-${Date.now()}`,
            type: 'revolute',
            bodyIdA: 'pivot',
            bodyIdB: 'bar1',
            localAnchorA: { x: 0, y: 0 },
            localAnchorB: { x: 0, y: 0 }
        });

        this.joints.push({
            id: `rev2-${Date.now()}`,
            type: 'revolute',
            bodyIdA: 'bar1',
            bodyIdB: 'bar2',
            localAnchorA: { x: 0, y: -this.params.l1 },
            localAnchorB: { x: 0, y: 0 }
        });

        bar1.angle = 1.0;
        bar2.angle = 0.5;
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

    derivatives(state: StateVector): StateVector {
        const deriv = new Array(this.bodies.length * 6).fill(0);
        let cursor = 0;
        for (const b of this.bodies) {
            deriv[cursor++] = b.vx;
            deriv[cursor++] = b.vy;
            deriv[cursor++] = 0; // accel x
            deriv[cursor++] = -this.params.gravity; // accel y
            deriv[cursor++] = b.omega;
            deriv[cursor++] = 0; // alpha
        }
        return deriv;
    }
    getTime(): number { return this.time; }
    setTime(t: number): void { this.time = t; }

    getParams(): RigidDoublePendulumParams { return { ...this.params }; }
    setParams(p: Partial<RigidDoublePendulumParams>): void { this.params = { ...this.params, ...p }; }

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
                    // Damping
                    b.vx *= (1 - this.params.damping * subDt);
                    b.vy *= (1 - this.params.damping * subDt);
                    b.omega *= (1 - this.params.damping * subDt);
                }
            }
            // Sync world vertices
            for (const b of this.bodies) {
                if (b.shape === 'polygon' && b.localVertices) {
                    const c = Math.cos(b.angle), sVal = Math.sin(b.angle);
                    b.worldVertices = b.localVertices.map(v => ({
                        x: b.x + (v.x * c - v.y * sVal), y: b.y + (v.x * sVal + v.y * c)
                    }));
                }
            }
            stepCollisionPipeline(this.bodies, { 
                joints: this.joints, 
                dt: subDt, 
                velocityIterations: 20, 
                positionIterations: 10 
            });
        }
        this.time += dt;
    }
}
