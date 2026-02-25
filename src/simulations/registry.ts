export interface SimulationPreset {
  id: string;
  name: string;
  pluginId: 'pendulum' | 'spring-mass';
  params: Record<string, number>;
}

export const simulationPresets: SimulationPreset[] = [
  {
    id: 'damped-pendulum',
    name: 'Damped Pendulum',
    pluginId: 'pendulum',
    params: {
      damping: 0.12,
    },
  },
  {
    id: 'ideal-pendulum',
    name: 'Ideal Pendulum',
    pluginId: 'pendulum',
    params: {
      damping: 0,
    },
  },
  {
    id: 'spring-mass',
    name: 'Spring Mass',
    pluginId: 'spring-mass',
    params: {},
  },
];

export const getPresetById = (id: string | null): SimulationPreset => {
  if (!id) return simulationPresets[0];
  return simulationPresets.find((preset) => preset.id === id) ?? simulationPresets[0];
};
