import { describe, it, expect } from 'vitest';
import { SceneEditorSimulation } from '../src/simulations/sceneEditor';

describe('SceneEditorSimulation Scaffold', () => {
  it('should initialize with a floor', () => {
    const sim = new SceneEditorSimulation();
    const bodies = sim.getBodies();
    expect(bodies.length).toBe(1);
    expect(bodies[0].id).toBe('floor');
    expect(bodies[0].invMass).toBe(0); // static
  });

  it('should add a circle correctly', () => {
    const sim = new SceneEditorSimulation();
    sim.addCircle(0, 5, 1);
    const bodies = sim.getBodies();
    expect(bodies.length).toBe(2);
    expect(bodies[1].shape).toBe('circle');
    expect(bodies[1].y).toBe(5);
    expect(bodies[1].invMass).toBeGreaterThan(0);
  });

  it('should fall under gravity', () => {
    const sim = new SceneEditorSimulation({ gravity: 10 });
    sim.addCircle(0, 0, 1);
    const bodies = sim.getBodies();
    const circle = bodies[1];
    
    const dt = 0.1;
    const state = sim.getState();
    const deriv = sim.derivatives(state, 0);
    
    // y derivative is vy (index 1 is y, index 3 is vy)
    // vy derivative is ay (index 3 is vy, index 9 is ay for the second body)
    // deriv for circle (2nd body): [vx, vy, ax, ay, w, alpha]
    // 2nd body's derivatives start at index 6
    expect(deriv[7]).toBe(0); // vy = 0 at start
    expect(deriv[9]).toBe(10); // ay = gravity
  });

  it('should clear scene on reset', () => {
    const sim = new SceneEditorSimulation();
    sim.addCircle(0, 0, 1);
    expect(sim.getBodies().length).toBe(2);
    sim.reset();
    expect(sim.getBodies().length).toBe(1); // Only floor
  });

  it('should serialize and deserialize correctly', () => {
    const sim = new SceneEditorSimulation();
    sim.addCircle(1, 2, 0.5);
    sim.addBox(3, 4, 1, 1);
    
    const json = sim.serialize();
    const data = JSON.parse(json);
    expect(data.bodies.length).toBe(2);
    
    const sim2 = new SceneEditorSimulation();
    sim2.deserialize(json);
    const bodies = sim2.getBodies();
    expect(bodies.length).toBe(3); // Floor + 2
    expect(bodies.find(b => b.id !== 'floor' && b.shape === 'circle')?.x).toBe(1);
    expect(bodies.find(b => b.id !== 'floor' && b.shape === 'aabb')?.x).toBe(3);
  });

  it('should preserve gravity param through serialize/deserialize', () => {
    const sim = new SceneEditorSimulation({ gravity: 12.5 });
    sim.addCircle(0, 0, 0.2);

    const json = sim.serialize();
    const sim2 = new SceneEditorSimulation();
    sim2.deserialize(json);

    expect(sim2.getParams().gravity).toBe(12.5);
  });

  it('should preserve joints through serialize/deserialize', () => {
    const sim = new SceneEditorSimulation();
    sim.addCircle(-0.5, 0, 0.2);
    sim.addCircle(0.5, 0, 0.2);
    const bodies = sim.getBodies().filter(b => b.id !== 'floor');

    sim.addRevoluteJoint(bodies[0].id, bodies[1].id, { x: 0, y: 0 });

    const json = sim.serialize();
    const data = JSON.parse(json);
    expect(data.joints.length).toBe(1);

    const sim2 = new SceneEditorSimulation();
    sim2.deserialize(json);
    const joints = sim2.getJoints();

    expect(joints.length).toBe(1);
    expect(joints[0].type).toBe('revolute');
    expect(joints[0].bodyIdA).toBe(bodies[0].id);
    expect(joints[0].bodyIdB).toBe(bodies[1].id);
  });

  it('should include scene format version in serialized payload', () => {
    const sim = new SceneEditorSimulation();
    sim.addCircle(0, 0, 0.2);
    const data = JSON.parse(sim.serialize());

    expect(data.version).toBe(2);
    expect(Array.isArray(data.bodies)).toBe(true);
    expect(Array.isArray(data.joints)).toBe(true);
  });

  it('should load legacy scene payload without version field', () => {
    const legacyPayload = JSON.stringify({
      bodies: [{
        id: 'legacy_circle',
        x: 1,
        y: 2,
        vx: 0,
        vy: 0,
        angle: 0,
        omega: 0,
        shape: 'circle',
        radius: 0.2,
        halfW: 0.2,
        halfH: 0.2,
        mass: 1,
        invMass: 1,
        inertia: 1,
        invInertia: 1,
        friction: 0.3
      }],
      joints: []
    });

    const sim = new SceneEditorSimulation();
    sim.deserialize(legacyPayload);
    const bodies = sim.getBodies();

    expect(bodies.length).toBe(2); // floor + legacy body
    expect(bodies.some(b => b.id === 'legacy_circle')).toBe(true);
    expect(sim.getParams().gravity).toBeCloseTo(9.8, 5);
  });
});
