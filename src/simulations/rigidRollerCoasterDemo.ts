import { BodyState } from '../engine2d/collision/types';
import { stepCollisionPipeline } from '../engine2d/collision/pipeline';
import { createBody, createPolyline, createPolygon } from '../engine2d/collision/bodyFactory';
import { SimulationModel, StateVector } from '../core/types';

export interface RigidRollerCoasterParams {
    gravity: number;
    friction: number;
    subSteps: number;
}

export class RigidRollerCoasterDemo implements SimulationModel {
    private bodies: BodyState[] = [];
    private time = 0;
    private params: RigidRollerCoasterParams;

    getJoints() { return []; }

    constructor(params: RigidRollerCoasterParams) {
        this.params = { ...params };
        this.reset();
    }

    static getDefaultParams(): RigidRollerCoasterParams {
        return {
            gravity: 9.8,
            friction: 0.1,
            subSteps: 10
        };
    }

    reset(): void {
        this.bodies = [];
        this.time = 0;

        const trackPoints: { x: number; y: number }[] = [];
        for (let i = 0; i <= 60; i++) {
            const tx = -15 + i * 0.5;
            const ty = 3.0 * Math.sin(tx * 0.4) + 1.0 * Math.cos(tx * 0.8) - 1.0;
            trackPoints.push({ x: tx, y: ty });
        }
        this.bodies.push(createPolyline('track', trackPoints));

        const cartVertices = [
            { x: -1.5, y: -0.8 },
            { x: 1.5, y: -0.8 },
            { x: 1.5, y: 1.0 },
            { x: -1.5, y: 1.0 }
        ];
        const cart = createPolygon('cart', cartVertices);
        cart.x = -13.5;
        const slope = this.trackSlope(cart.x);
        const tangentNorm = Math.hypot(1, slope);
        const tangentX = 1 / tangentNorm;
        const tangentY = slope / tangentNorm;
        const speed = 2.2;
        // Start the cart close to the rail with tangent velocity so it rides immediately.
        cart.y = this.trackY(cart.x) + 0.72;
        cart.vx = tangentX * speed;
        cart.vy = tangentY * speed;
        cart.angle = Math.atan2(tangentY, tangentX);
        cart.restitution = 0.2;
        cart.friction = 0.4;
        this.bodies.push(cart);
    }

    private trackY(x: number): number {
        return 3.0 * Math.sin(x * 0.4) + 1.0 * Math.cos(x * 0.8) - 1.0;
    }

    private trackSlope(x: number): number {
        return 1.2 * Math.cos(x * 0.4) - 0.8 * Math.sin(x * 0.8);
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

    getParams(): RigidRollerCoasterParams { return { ...this.params }; }
    setParams(p: Partial<RigidRollerCoasterParams>): void { this.params = { ...this.params, ...p }; }

    getBodies(): BodyState[] { return this.bodies; }

    step(dt: number): void {
        const subDt = dt / this.params.subSteps;
        for (let s = 0; s < this.params.subSteps; s++) {
            // Integrate
            for (const b of this.bodies) {
                if (b.invMass > 0) {
                    b.vy -= this.params.gravity * subDt;
                    b.x += b.vx * subDt;
                    b.y += b.vy * subDt;
                    b.angle += b.omega * subDt;
                    
                    // Air resistance
                    b.vx *= 0.999; b.vy *= 0.999; b.omega *= 0.995;
                }
            }

            // Update world vertices
            for (const b of this.bodies) {
                if (b.shape === 'polygon' && b.localVertices) {
                    const cos = Math.cos(b.angle);
                    const sin = Math.sin(b.angle);
                    b.worldVertices = b.localVertices.map(v => ({
                        x: b.x + (v.x * cos - v.y * sin),
                        y: b.y + (v.x * sin + v.y * cos)
                    }));
                }
            }

            // Resolve
            stepCollisionPipeline(this.bodies, { velocityIterations: 16, positionIterations: 8, dt: subDt });
        }
        this.time += dt;
    }
}
