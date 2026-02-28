# Demo Scenarios: Phase 3.5

Follow these scenarios to explore the new features of Phase 3.5.

## 1. High-speed Tunneling: Discrete vs CCD

- **Setup**: Open `Collision Lab`.
- **Action**: Set initial velocity of a small circle to 150+ towards a thin AABB wall.
- **Observation**:
  - **Discrete mode**: Circle might pass through the wall (tunneling).
  - **CCD mode (Auto-enabled)**: Circle correctly impacts the wall and bounces back.

## 2. Stacking Stability: Manifold + Rotation

- **Setup**: Open `Collision Lab` or use a preset with stacked boxes.
- **Action**: Create a stack of 3-5 AABB boxes. Apply a light off-center force to the top one.
- **Observation**: The stack remains stable and adjusts via manifold contacts rather than vibrating or exploding, proving SAT performance.

## 3. Hanging Chain Pull/Release

- **Setup**: Select `Hanging Chain`.
- **Action**: Grab the bottom node and pull it far to the side. Release it.
- **Observation**: The chain behaves with realistic inertia. Adjust `Stiffness` to see it behave more like a string vs a stiff wire.

## 4. Pile Attract Orbit-like Preset

- **Setup**: Select `Pile Attract`.
- **Action**:
  1. Set `Damping` to 0.01.
  2. Increase `Attract Strength` to 5.0.
  3. Reset simulation.
  4. Quickly drag the attractor or the particles to give them tangential velocity.
- **Observation**: Particles will enter stable or decaying orbits around the center, demonstrating gravitational-style attraction.

## 5. Double Pendulum Chaos (Butterfly Effect)

- **Setup**: Select `Chaos: Double Pendulum`.
- **Action**:
  1. Observe the two trails (Sky Blue and Red) overlapping perfectly at the start.
  2. Increase `Epsilon` to 0.01 and observe how much faster they diverge.
  3. Drag the end of the pendulum to a high-elevation state and release.
- **Observation**: The `λ ≈ 1.25` Lyapunov value indicates chaotic region. Watch the "Phase Distance" HUD value grow exponentially.
