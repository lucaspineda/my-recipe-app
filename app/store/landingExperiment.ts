import { create } from 'zustand';
import type { LandingVariant } from '../lib/landingExperiment';

interface LandingExperimentStore {
  variant: LandingVariant | null;
  setVariant: (variant: LandingVariant) => void;
}

export const useLandingExperimentStore = create<LandingExperimentStore>((set) => ({
  variant: null,
  setVariant: (variant) => set(() => ({ variant })),
}));
