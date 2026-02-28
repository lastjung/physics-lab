export const REGRESSION_THRESHOLDS = {
  springMass: {
    periodRelErrMax: 0.01,
    energyDriftMax: 0.005,
  },
  dampedPendulum: {
    decayRatioMax: 0.5,
    nonIncreasingMin: 6,
    endEnergyRatioMax: 0.25,
    upSpikeRatioMax: 0.002,
  },
  orbit: {
    energyDriftMax: 0.015,
    angularMomentumDriftMax: 0.015,
  },
} as const;
