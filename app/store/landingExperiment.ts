import { create } from 'zustand';
import type { LandingVariant } from '../lib/landingExperiment';

interface LandingExperimentStore {
  variant: LandingVariant | null;
  // False until a page has read the variant cookie; it can then still be null (visitor not in the test)
  resolved: boolean;
  setVariant: (variant: LandingVariant | null) => void;
}

export const useLandingExperimentStore = create<LandingExperimentStore>((set) => ({
  variant: null,
  resolved: false,
  setVariant: (variant) => set(() => ({ variant, resolved: true })),
}));
