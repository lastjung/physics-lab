import type { SimulationModel, StateVector } from '../core/types';
import { BodyState } from '../engine2d/collision/types';
import { stepCollisionPipeline } from '../engine2d/collision/pipeline';
import { createBody } from '../engine2d/collision/bodyFactory';
import { Joint, PrismaticJoint } from '../engine2d/joints/types';

export interface SceneEditorParams {
  gravity: number;
}

interface SerializedSceneEditorData {
  version?: number;
  bodies?: any[];
  joints?: Joint[];
  params?: Partial<SceneEditorParams>;
}

const SCENE_FORMAT_VERSION = 2;

const defaultParams: SceneEditorParams = {
  gravity: 9.8,
};

export class SceneEditorSimulation implements SimulationModel {
  private bodies: BodyState[] = [];
  private joints: Joint[] = [];
  private time = 0;
  private params: SceneEditorParams;

  constructor(params: Partial<SceneEditorParams> = {}) {
    this.params = { ...defaultParams, ...params };
    this.reset();
  }

  static getDefaultParams(): SceneEditorParams {
    return { ...defaultParams };
  }

  // Implementation follows the pattern of other Engine2D simulations
  // but with dynamic body/joint addition capabilities
  
  getState(): StateVector {
    // [x1, y1, vx1, vy1, r1, w1, ...]
    const state: number[] = [];
    for (const b of this.bodies) {
      state.push(b.x, b.y, b.vx, b.vy, b.angle, b.omega);
    }
    return state;
  }

  setState(next: StateVector): void {
    let cursor = 0;
    for (let i = 0; i < this.bodies.length; i++) {
        const b = this.bodies[i];
        b.x = next[cursor++];
        b.y = next[cursor++];
        b.vx = next[cursor++];
        b.vy = next[cursor++];
        b.angle = next[cursor++];
        b.omega = next[cursor++];
    }
  }

  derivatives(state: StateVector, _time: number): StateVector {
    const deriv: number[] = [];
    for (let i = 0; i < this.bodies.length; i++) {
        const b = this.bodies[i];
        const vx = state[i * 6 + 2];
        const vy = state[i * 6 + 3];
        const omega = state[i * 6 + 5];

        // Only gravity
        let ax = 0;
        let ay = b.invMass > 0 ? this.params.gravity : 0;
        let alpha = 0;

        deriv.push(vx, vy, ax, ay, omega, alpha);
    }
    return deriv;
  }

  resolveCollisions(dt: number): void {
    stepCollisionPipeline(this.bodies, { joints: this.joints, dt });
  }

  step(dt: number): void {
      // 1. Semi-implicit Euler
      for (const b of this.bodies) {
          if (b.invMass === 0) continue;
          // Gravity
          b.vy += this.params.gravity * dt;
          
          b.vx += 0; // No other forces for now
          b.x += b.vx * dt;
          b.y += b.vy * dt;
          b.angle += b.omega * dt;
      }
      
      // 2. Resolve
      this.resolveCollisions(dt);
      this.time += dt;
  }

  reset(): void {
    this.bodies = [];
    this.joints = [];
    this.time = 0;

    // Default floor
    const floor = createBody('floor', 4.0, 0.2, { isStatic: true });
    floor.y = -1.5;
    this.bodies.push(floor);
  }

  getTime(): number {
    return this.time;
  }

  setTime(time: number): void {
    this.time = time;
  }

  setParam<K extends keyof SceneEditorParams>(key: K, value: SceneEditorParams[K]): void {
    this.params = { ...this.params, [key]: value };
  }

  getParams(): SceneEditorParams {
    return { ...this.params };
  }

  // --- Scaffold specific: Add Object ---
  addCircle(x: number, y: number, radius: number): void {
      const circle = createBody(`circle_${Date.now()}`, radius * 2, radius * 2, { radius });
      circle.x = x;
      circle.y = y;
      this.bodies.push(circle);
  }

  addBox(x: number, y: number, w: number, h: number): void {
      const box = createBody(`box_${Date.now()}`, w, h);
      box.x = x;
      box.y = y;
      this.bodies.push(box);
  }

  getBodyAt(x: number, y: number): BodyState | null {
      // Find top-most body at point (reverse order)
      for (let i = this.bodies.length - 1; i >= 0; i--) {
          const b = this.bodies[i];
          if (b.id === 'floor') continue;

          const dx = x - b.x;
          const dy = y - b.y;

          if (b.shape === 'circle') {
              if (dx * dx + dy * dy <= b.radius * b.radius) return b;
          } else if (b.shape === 'aabb') {
              // Simple AABB check (ignoring rotation for selection scaffold)
              if (Math.abs(dx) <= b.halfW! && Math.abs(dy) <= b.halfH!) return b;
          }
      }
      return null;
  }

  getBodies(): BodyState[] {
      return this.bodies;
  }

  getJoints(): Joint[] {
      return this.joints;
  }

  addRevoluteJoint(idA: string, idB: string, worldPos: { x: number; y: number }): void {
      const bA = this.bodies.find(b => b.id === idA);
      const bB = this.bodies.find(b => b.id === idB);
      if (!bA || !bB) return;

      const joint: Joint = {
          id: `rev_${Date.now()}`,
          type: 'revolute',
          bodyIdA: idA,
          bodyIdB: idB,
          localAnchorA: this.toLocal(bA, worldPos),
          localAnchorB: this.toLocal(bB, worldPos),
          referenceAngle: bB.angle - bA.angle
      };
      this.joints.push(joint);
  }

  addPrismaticJoint(idA: string, idB: string, worldPos: { x: number; y: number }, worldAxis: { x: number; y: number }): void {
      const bA = this.bodies.find(b => b.id === idA);
      const bB = this.bodies.find(b => b.id === idB);
      if (!bA || !bB) return;

      const joint: PrismaticJoint = {
          id: `prism_${Date.now()}`,
          type: 'prismatic',
          bodyIdA: idA,
          bodyIdB: idB,
          localAnchorA: this.toLocal(bA, worldPos),
          localAnchorB: this.toLocal(bB, worldPos),
          localAxisA: this.toLocalDir(bA, worldAxis),
          referenceAngle: bB.angle - bA.angle
      };
      this.joints.push(joint);
  }

  addWeldJoint(idA: string, idB: string, worldPos: { x: number; y: number }): void {
      const bA = this.bodies.find(b => b.id === idA);
      const bB = this.bodies.find(b => b.id === idB);
      if (!bA || !bB) return;

      const joint: Joint = {
          id: `weld_${Date.now()}`,
          type: 'weld',
          bodyIdA: idA,
          bodyIdB: idB,
          localAnchorA: this.toLocal(bA, worldPos),
          localAnchorB: this.toLocal(bB, worldPos),
          referenceAngle: bB.angle - bA.angle
      };
      this.joints.push(joint);
  }

  updateJoint(jointId: string, params: Partial<Joint>): void {
      const joint = this.joints.find(j => j.id === jointId);
      if (joint) {
          Object.assign(joint, params);
      }
  }

  removeJoint(jointId: string): void {
      this.joints = this.joints.filter(j => j.id !== jointId);
  }

  getJointAt(x: number, y: number): Joint | null {
      const threshold = 0.05;
      for (const j of this.joints) {
          // Check collision with anchor (approximation for selection)
          const bA = this.bodies.find(b => b.id === j.bodyIdA);
          if (!bA) continue;
          const worldA = this.toWorld(bA, j.localAnchorA);
          const dx = x - worldA.x;
          const dy = y - worldA.y;
          if (dx * dx + dy * dy < threshold * threshold) return j;
      }
      return null;
  }

  private toLocal(b: BodyState, world: { x: number; y: number }) {
      const dx = world.x - b.x;
      const dy = world.y - b.y;
      const cos = Math.cos(-b.angle);
      const sin = Math.sin(-b.angle);
      return {
          x: dx * cos - dy * sin,
          y: dx * sin + dy * cos
      };
  }

  private toWorld(b: BodyState, local: { x: number; y: number }) {
      const cos = Math.cos(b.angle);
      const sin = Math.sin(b.angle);
      return {
          x: b.x + (local.x * cos - local.y * sin),
          y: b.y + (local.x * sin + local.y * cos)
      };
  }

  private toLocalDir(b: BodyState, worldDir: { x: number; y: number }) {
      const cos = Math.cos(-b.angle);
      const sin = Math.sin(-b.angle);
      return {
          x: worldDir.x * cos - worldDir.y * sin,
          y: worldDir.x * sin + worldDir.y * cos
      };
  }

  serialize(): string {
      // Filter out floor as it's static/recreated on reset
      const sceneData: SerializedSceneEditorData = {
          version: SCENE_FORMAT_VERSION,
          bodies: this.bodies.filter(b => b.id !== 'floor').map(b => ({
              id: b.id,
              x: b.x,
              y: b.y,
              vx: b.vx,
              vy: b.vy,
              angle: b.angle,
              omega: b.omega,
              shape: b.shape,
              radius: b.radius,
              halfW: b.halfW,
              halfH: b.halfH,
              mass: b.mass,
              invMass: b.invMass,
              inertia: b.inertia,
              invInertia: b.invInertia,
              friction: b.friction
          })),
          joints: this.joints.map(j => ({ ...j })),
          params: { ...this.params }
      };
      return JSON.stringify(sceneData);
  }

  deserialize(dataStr: string): void {
      try {
          const data = JSON.parse(dataStr) as SerializedSceneEditorData;
          const version = Number(data.version ?? 1);
          this.reset();
          if (data.bodies) {
              data.bodies.forEach((b: any) => {
                  this.bodies.push({
                      ...b,
                      // Ensure numeric types
                      x: Number(b.x),
                      y: Number(b.y),
                      vx: Number(b.vx),
                      vy: Number(b.vy),
                      angle: Number(b.angle),
                      omega: Number(b.omega)
                  });
              });
          }
          if (data.joints) {
              this.joints = data.joints;
          }
          if (data.params) {
              this.params = {
                  ...this.params,
                  gravity: Number(data.params.gravity ?? this.params.gravity)
              };
          } else if (version <= 1) {
              // Legacy scenes had no params object; keep defaults for compatibility.
              this.params = { ...defaultParams };
          }
      } catch (e) {
          console.error('Failed to deserialize scene:', e);
      }
  }
}
