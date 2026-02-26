export interface SimulationPreset {
  id: string;
  name: string;
  pluginId: 'pendulum' | 'spring-mass' | 'double-pendulum' | 'driven-pendulum' | 'coupled-spring' | 'orbit' | 'collision-lab';
  category: 'Oscillation' | 'Mechanics';
  summary: string;
  params: Record<string, number>;
}

export const simulationPresets: SimulationPreset[] = [
  {
    id: 'damped-pendulum',
    name: 'Damped Pendulum',
    pluginId: 'pendulum',
    category: 'Oscillation',
    summary: 'Dissipative pendulum with friction-like damping.',
    params: {
      damping: 0.12,
    },
  },
  {
    id: 'ideal-pendulum',
    name: 'Ideal Pendulum',
    pluginId: 'pendulum',
    category: 'Oscillation',
    summary: 'Frictionless pendulum for baseline period/energy behavior.',
    params: {
      damping: 0,
    },
  },
  {
    id: 'spring-mass',
    name: 'Spring Mass',
    pluginId: 'spring-mass',
    category: 'Mechanics',
    summary: 'Single-axis spring oscillator with tunable stiffness.',
    params: {},
  },
  {
    id: 'double-pendulum',
    name: 'Double Pendulum',
    pluginId: 'double-pendulum',
    category: 'Oscillation',
    summary: 'Chaotic coupled pendulum dynamics with two links.',
    params: {
      damping: 0.02,
    },
  },
  {
    id: 'driven-pendulum',
    name: 'Driven Pendulum',
    pluginId: 'driven-pendulum',
    category: 'Oscillation',
    summary: 'Pendulum with periodic external forcing and tunable damping.',
    params: {
      damping: 0.08,
      driveAmplitude: 0.9,
      driveFrequency: 1.8,
    },
  },
  {
    id: 'coupled-spring',
    name: 'Coupled Spring',
    pluginId: 'coupled-spring',
    category: 'Mechanics',
    summary: 'Two masses coupled by springs exchanging energy over time.',
    params: {
      damping: 0.25,
    },
  },
  {
    id: 'orbit',
    name: 'Orbit',
    pluginId: 'orbit',
    category: 'Mechanics',
    summary: '2D central-force orbit with adjustable gravity and damping.',
    params: {
      damping: 0.003,
      mu: 9.5,
    },
  },
  {
    id: 'collision-lab',
    name: 'Collision Lab',
    pluginId: 'collision-lab',
    category: 'Mechanics',
    summary: 'Two-body collisions with wall bounce and adjustable restitution.',
    params: {
      restitution: 0.94,
      wallRestitution: 0.92,
    },
  },
];

export const getPresetById = (id: string | null): SimulationPreset => {
  if (!id) return simulationPresets[0];
  return simulationPresets.find((preset) => preset.id === id) ?? simulationPresets[0];
};
