# Rigid Double Pendulum Survey

## 1. Overview

The **Rigid Double Pendulum** differs from the point-mass based "Ideal Double Pendulum" by modeling the links as rigid bars (e.g., rectangles) with specific mass distribution and rotational inertia.

## 2. Key Differences

| Feature         | Point-Mass (ODE / Ideal)           | Rigid Body (Engine2D)                                                        |
| :-------------- | :--------------------------------- | :--------------------------------------------------------------------------- |
| **Model**       | 2 point masses at ends             | 2 bars with width/height                                                     |
| **Inertia**     | Point mass formula ($m \cdot L^2$) | Rectangle inertia ($\frac{1}{12} \cdot m \cdot (w^2 + h^2)$ + Parallel Axis) |
| **Constraint**  | Stiff ODE or Distance Joint        | Revolute Joint at specific anchor                                            |
| **Interaction** | Difficult to "grab" the shaft      | Can grab and rotate any part of the bar                                      |
| **Stability**   | RK4 depends on $dt$                | Baumgarte/PGS depends on Iterations                                          |

## 3. Implementation Scaffold

The Rigid Double Pendulum in the Physics Lab will:

1. Use `Polygon` shapes for the two links.
2. Connect them via `RevoluteJoint` to a static pivot and to each other.
3. Allow real-time tuning of length, width, and mass.
4. Provide higher stability at the cost of slight "softness" in the joint (tunable with sub-steps).

## 4. Stability Targets

- Sub-steps: 4-8 recommended for chaotic motion.
- Velocity Iterations: 12+.
- Warm Starting: Enabled to reduce jitter.
