'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { LandingVariant } from '../../lib/landingExperiment';

// What the server knew from cookies when it rendered the page, so the first render (server and browser alike)
// can show the right thing before Firebase Auth and the client-side stores have loaded.
interface InitialRender {
  // The visitor's landing A/B variant; null for returning signed-in users and before one is assigned
  landingVariant: LandingVariant | null;
  // This browser was signed in last time (see lib/signedInHint)
  signedInHint: boolean;
}

const InitialRenderContext = createContext<InitialRender>({ landingVariant: null, signedInHint: false });

export function InitialRenderProvider({ value, children }: { value: InitialRender; children: ReactNode }) {
  return <InitialRenderContext.Provider value={value}>{children}</InitialRenderContext.Provider>;
}

export const useInitialRender = () => useContext(InitialRenderContext);
