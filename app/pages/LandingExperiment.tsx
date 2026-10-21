'use client';

import { useEffect, useRef } from 'react';
import Landing from './Landing';
import LegacyLanding from './LegacyLanding';
import { assignLandingVariant } from '../lib/landingExperiment';
import { trackPageVisit } from '../lib/analytics';
import { useLandingExperimentStore } from '../store/landingExperiment';

// Shows each logged-out visitor one of the two landing pages and logs the visit (the test's denominator)
export default function LandingExperiment() {
  const { variant, setVariant } = useLandingExperimentStore();
  const visitTracked = useRef(false);

  useEffect(() => {
    setVariant(assignLandingVariant());
    if (!visitTracked.current) {
      visitTracked.current = true;
      trackPageVisit('landing');
    }
  }, [setVariant]);

  if (!variant) return <div className="min-h-screen" />;
  return variant === 'redesign' ? <Landing /> : <LegacyLanding />;
}
