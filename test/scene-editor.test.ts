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
});
