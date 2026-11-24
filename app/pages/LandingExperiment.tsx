'use client';

import { useEffect, useRef } from 'react';
import Landing from './Landing';
import LegacyLanding from './LegacyLanding';
import { assignLandingVariant } from '../lib/landingExperiment';
import { trackPageVisit } from '../lib/analytics';
import { useLandingExperimentStore } from '../store/landingExperiment';
import { useInitialRender } from '../components/ClientWrapper/InitialRender';
import { auth } from '../hooks/userAuth';

// Shows each logged-out visitor one of the two landing pages and logs the visit (the test's denominator).
// The server already assigned the variant (middleware.ts), so the page is in the first HTML response.
export default function LandingExperiment() {
  const { variant: storedVariant, setVariant } = useLandingExperimentStore();
  const { landingVariant } = useInitialRender();
  const variant = storedVariant ?? landingVariant;
  const visitTracked = useRef(false);

  useEffect(() => {
    setVariant(assignLandingVariant());
    // The page now shows before Auth has loaded, so wait for it: a signed-in user is not a landing visitor
    auth.authStateReady().then(() => {
      if (visitTracked.current || auth.currentUser) return;
      visitTracked.current = true;
      trackPageVisit('landing');
    });
  }, [setVariant]);

  if (!variant) return <div className="min-h-screen" />;
  return variant === 'redesign' ? <Landing /> : <LegacyLanding />;
}
