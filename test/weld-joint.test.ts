import { describe, it, expect } from 'vitest';
import { SceneEditorSimulation } from '../src/simulations/sceneEditor';
import { createBody } from '../src/engine2d/collision/bodyFactory';

describe('Weld Joint Regression', () => {
    it('should keep two bodies fixed relative to each other', () => {
        const sim = new SceneEditorSimulation({ gravity: 0 });
        const bA = createBody('a', 10, 10);
        const bB = createBody('b', 10, 10);
        bB.x = 20; bB.y = 0;
        
        // Add bodies to simulation manually for testing
        (sim as any).bodies = [bA, bB];
        
        // Weld them at center between them
        sim.addWeldJoint('a', 'b', { x: 10, y: 0 });
        
        const initialAngleDiff = bB.angle - bA.angle;
        const initialDist = Math.hypot(bB.x - bA.x, bB.y - bA.y);
        
        // Apply motion
        bA.vx = 2;
        bA.omega = 0.5;
        
        // Step simulation many times
        for (let i = 0; i < 30; i++) {
            sim.step(1/60);
        }
        
        const finalAngleDiff = bB.angle - bA.angle;
        const finalDist = Math.hypot(bB.x - bA.x, bB.y - bA.y);
        
        // Final positions check
        expect(bA.x).toBeGreaterThan(0.1); // Should have moved
        expect(bB.x).toBeGreaterThan(bA.x); // Should stay ahead
        
        // Verify relative state is maintained
        expect(finalAngleDiff).toBeCloseTo(initialAngleDiff, 0.05);
        expect(finalDist).toBeCloseTo(initialDist, 0.05);
    });

    it('should correctly serialize and deserialize weld joints', () => {
        const sim = new SceneEditorSimulation();
        const bA = createBody('a', 1, 1);
        const bB = createBody('b', 1, 1);
        bB.x = 2;
        (sim as any).bodies = [bA, bB];
        
        sim.addWeldJoint('a', 'b', { x: 1, y: 0 });
        
        const data = sim.serialize();
        const sim2 = new SceneEditorSimulation();
        sim2.deserialize(data);
        
        const joints = sim2.getJoints();
        expect(joints.length).toBe(1);
        expect(joints[0].type).toBe('weld');
        expect(joints[0].bodyIdA).toBe('a');
        expect(joints[0].bodyIdB).toBe('b');
    });
});
