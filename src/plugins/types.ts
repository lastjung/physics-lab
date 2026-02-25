export interface PluginContext {
  canvas: HTMLCanvasElement;
  menuRoot: HTMLElement;
  initialValues: Record<string, number>;
  presetValues: Record<string, number>;
  onStats: (text: string) => void;
  onStateChange: (values: Record<string, number>) => void;
}

export interface ActivePlugin {
  play(): void;
  pause(): void;
  isRunning(): boolean;
  reset(): void;
  step(count?: number): void;
  destroy(): void;
}

export interface SimulationPlugin {
  id: string;
  create(context: PluginContext): ActivePlugin;
}
