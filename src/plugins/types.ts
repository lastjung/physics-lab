export interface PluginContext {
  canvas: HTMLCanvasElement;
  menuRoot: HTMLElement;
  initialValues: Record<string, number>;
  presetValues: Record<string, number>;
  onStats: (line1: string, line2: string) => void;
  onStateChange: (values: Record<string, number>) => void;
  onSfx: (type: 'click' | 'step' | 'drag-start' | 'drag-end' | 'reset', intensity?: number) => void;
  onPendulumMotion?: (omega: number, theta: number) => void;
  onSpringMotion?: (velocity: number, displacement: number) => void;
}

export interface ActivePlugin {
  play(): void;
  pause(): void;
  isRunning(): boolean;
  reset(): void;
  step(count?: number): void;
  destroy(): void;
  onResize?(width: number, height: number): void;
  onPause?(): void;
  onResume?(): void;
}

export interface SimulationPlugin {
  id: string;
  create(context: PluginContext): ActivePlugin;
}
