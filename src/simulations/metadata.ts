export interface ParameterMetadata {
  label: string;
  min: number;
  max: number;
  step: number;
}

export const pluginMetadata: Record<string, Record<string, ParameterMetadata>> = {
  pendulum: {
    length: { label: 'Length', min: 0.5, max: 2.0, step: 0.1 },
    gravity: { label: 'Gravity', min: 1.0, max: 20.0, step: 0.1 },
    damping: { label: 'Damping', min: 0.0, max: 1.0, step: 0.01 },
  },
  'spring-mass': {
    mass: { label: 'Mass', min: 0.5, max: 5.0, step: 0.1 },
    k: { label: 'Spring Constant', min: 1.0, max: 50.0, step: 0.5 },
    damping: { label: 'Damping', min: 0.0, max: 2.0, step: 0.05 },
  },
  'double-pendulum': {
    l1: { label: 'Link 1 Length', min: 0.5, max: 1.5, step: 0.1 },
    m1: { label: 'Mass 1', min: 0.5, max: 5.0, step: 0.1 },
    l2: { label: 'Link 2 Length', min: 0.5, max: 1.5, step: 0.1 },
    m2: { label: 'Mass 2', min: 0.5, max: 5.0, step: 0.1 },
    g: { label: 'Gravity', min: 0.0, max: 20.0, step: 0.1 },
  },
  'driven-pendulum': {
    length: { label: 'Length', min: 0.5, max: 1.5, step: 0.1 },
    gravity: { label: 'Gravity', min: 1.0, max: 20.0, step: 0.1 },
    damping: { label: 'Damping', min: 0.0, max: 1.0, step: 0.01 },
    driveAmp: { label: 'Drive Amplitude', min: 0.0, max: 2.0, step: 0.1 },
    driveFreq: { label: 'Drive Frequency', min: 0.1, max: 5.0, step: 0.1 },
  },
  'coupled-spring': {
    m1: { label: 'Mass 1', min: 0.1, max: 5.0, step: 0.1 },
    m2: { label: 'Mass 2', min: 0.1, max: 5.0, step: 0.1 },
    k1: { label: 'Spring 1 (Wall)', min: 1.0, max: 30.0, step: 0.5 },
    k2: { label: 'Spring 2 (Coupler)', min: 0.0, max: 30.0, step: 0.5 },
    damping: { label: 'Damping', min: 0.0, max: 2.0, step: 0.05 },
  },
  orbit: {
    mu: { label: 'Gravitational Mu', min: 0.1, max: 10.0, step: 0.1 },
    damping: { label: 'Damping', min: 0.0, max: 1.0, step: 0.01 },
    initialX: { label: 'Initial X', min: -5.0, max: 5.0, step: 0.1 },
    initialY: { label: 'Initial Y', min: -5.0, max: 5.0, step: 0.1 },
    initialVx: { label: 'Initial Vx', min: -5.0, max: 5.0, step: 0.1 },
    initialVy: { label: 'Initial Vy', min: -5.0, max: 5.0, step: 0.1 },
  },
  'collision-lab': {
    m1: { label: 'Mass 1', min: 0.1, max: 10.0, step: 0.1 },
    m2: { label: 'Mass 2', min: 0.1, max: 10.0, step: 0.1 },
    e: { label: 'Restitution (e)', min: 0.0, max: 1.0, step: 0.01 },
  },
  billiards: {
    radius: { label: 'Ball Radius', min: 0.02, max: 0.1, step: 0.005 },
    friction: { label: 'Table Friction', min: 0.0, max: 1.0, step: 0.05 },
    restitution: { label: 'Wall Bounciness', min: 0.5, max: 1.0, step: 0.02 },
  },
  'car-suspension': {
    ms: { label: 'Sprung Mass (Body)', min: 100, max: 500, step: 10 },
    mu: { label: 'Unsprung Mass (Wheel)', min: 10, max: 80, step: 5 },
    ks: { label: 'Main Spring', min: 500, max: 5000, step: 100 },
    cs: { label: 'Damper', min: 10, max: 800, step: 10 },
    kt: { label: 'Tire Stiffness', min: 1000, max: 10000, step: 200 },
  },
  'newtons-cradle': {
    count: { label: 'Ball Count', min: 2, max: 5, step: 1 },
    radius: { label: 'Ball Radius', min: 0.1, max: 0.3, step: 0.01 },
    restitution: { label: 'Elasticity', min: 0.8, max: 1.0, step: 0.01 },
  },
  'cart-pendulum': {
    mc: { label: 'Cart Mass', min: 0.5, max: 10.0, step: 0.5 },
    mp: { label: 'Pendulum Mass', min: 0.1, max: 5.0, step: 0.1 },
    length: { label: 'Rod Length', min: 0.5, max: 1.5, step: 0.1 },
    damping: { label: 'Damping', min: 0.0, max: 1.0, step: 0.01 },
  },
  'roller-coaster': {
    mass: { label: 'Car Mass', min: 0.5, max: 5.0, step: 0.1 },
    gravity: { label: 'Gravity', min: 1.0, max: 20.0, step: 0.1 },
    friction: { label: 'Track Friction', min: 0.0, max: 0.5, step: 0.01 },
  },
  'roller-coaster-two-balls': {
    m1: { label: 'Ball 1 Mass', min: 0.5, max: 5.0, step: 0.1 },
    m2: { label: 'Ball 2 Mass', min: 0.5, max: 5.0, step: 0.1 },
    gravity: { label: 'Gravity', min: 1.0, max: 20.0, step: 0.1 },
    friction: { label: 'Track Friction', min: 0.0, max: 0.5, step: 0.01 },
    e: { label: 'Collision Bounciness', min: 0.5, max: 1.0, step: 0.05 },
  },
  'hanging-chain': {
    stiffness: { label: 'Stiffness (Beta)', min: 0.01, max: 1.0, step: 0.01 },
  },
  'pile-attract': {
    restitution: { label: 'Restitution', min: 0.0, max: 1.0, step: 0.05 },
  },
  'double-pendulum-compare': {
    epsilon: { label: 'Initial Offset (ε)', min: 1e-10, max: 1e-1, step: 1e-10 },
    l1: { label: 'Link 1 Length', min: 0.5, max: 2.0, step: 0.1 },
    l2: { label: 'Link 2 Length', min: 0.5, max: 2.0, step: 0.1 },
    damping: { label: 'Damping', min: 0.0, max: 0.2, step: 0.005 },
  },
  'revolute-demo': {
    motorSpeed: { label: 'Target Speed', min: -10, max: 10, step: 0.5 },
    maxMotorTorque: { label: 'Max Torque', min: 0, max: 200, step: 5 },
    lowerAngle: { label: 'Lower Limit', min: -180, max: 180, step: 1 },
    upperAngle: { label: 'Upper Limit', min: -180, max: 180, step: 1 },
  },
};
