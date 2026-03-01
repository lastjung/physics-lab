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
  'double-pendulum-engine': {
    length1: { label: 'Link 1 Length', min: 0.5, max: 1.7, step: 0.02 },
    length2: { label: 'Link 2 Length', min: 0.5, max: 1.7, step: 0.02 },
    mass1: { label: 'Mass 1', min: 0.2, max: 3.0, step: 0.05 },
    mass2: { label: 'Mass 2', min: 0.2, max: 3.0, step: 0.05 },
    damping: { label: 'Damping', min: 0.0, max: 0.2, step: 0.005 },
    iterations: { label: 'Joint Iterations', min: 4, max: 30, step: 1 },
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
  'cart-pendulum-engine': {
    cartMass: { label: 'Cart Mass', min: 0.5, max: 4.0, step: 0.05 },
    bobMass: { label: 'Bob Mass', min: 0.1, max: 2.5, step: 0.05 },
    length: { label: 'Rod Length', min: 0.45, max: 1.5, step: 0.01 },
    cartSpring: { label: 'Cart Spring', min: 0, max: 8, step: 0.05 },
    cartDamping: { label: 'Cart Damping', min: 0, max: 1.0, step: 0.01 },
    linearDamping: { label: 'Linear Damping', min: 0, max: 0.2, step: 0.001 },
    driveAmplitude: { label: 'Drive Amplitude', min: 0, max: 3, step: 0.05 },
    driveFrequency: { label: 'Drive Frequency', min: 0.1, max: 4, step: 0.05 },
    iterations: { label: 'Joint Iterations', min: 4, max: 30, step: 1 },
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
  'roller-coaster-spring': {
    gravity: { label: 'Gravity', min: 1.0, max: 20.0, step: 0.1 },
    damping: { label: 'Track Damping', min: 0.0, max: 0.5, step: 0.01 },
    springK: { label: 'Spring K', min: 0, max: 30, step: 0.1 },
    springDamping: { label: 'Spring Damping', min: 0, max: 2, step: 0.01 },
  },
  'roller-coaster-flight': {
    gravity: { label: 'Gravity', min: 1.0, max: 20.0, step: 0.1 },
    damping: { label: 'Damping', min: 0.0, max: 0.5, step: 0.01 },
    flightThreshold: { label: 'Flight Threshold', min: -4, max: 2, step: 0.05 },
  },
  'colliding-blocks': {
    gravity: { label: 'Gravity', min: 0, max: 20, step: 0.1 },
    damping: { label: 'Damping', min: 0, max: 0.2, step: 0.001 },
    restitution: { label: 'Block Restitution', min: 0.1, max: 1.0, step: 0.01 },
    wallRestitution: { label: 'Wall Restitution', min: 0.1, max: 1.0, step: 0.01 },
  },
  'polygon-shapes': {
    gravity: { label: 'Gravity', min: 0, max: 20, step: 0.1 },
    damping: { label: 'Linear Damping', min: 0, max: 0.2, step: 0.001 },
    angularDamping: { label: 'Angular Damping', min: 0, max: 0.2, step: 0.001 },
    restitution: { label: 'Restitution', min: 0.1, max: 1.0, step: 0.01 },
    wallRestitution: { label: 'Wall Restitution', min: 0.1, max: 1.0, step: 0.01 },
    friction: { label: 'Friction', min: 0, max: 1.0, step: 0.01 },
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
