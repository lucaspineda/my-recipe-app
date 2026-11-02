'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Signup from '../pages/Signup';
import LegacySignup from '../pages/LegacySignup';
import { getLandingVariant } from '../lib/landingExperiment';
import { trackPageVisit } from '../lib/analytics';
import { useLandingExperimentStore } from '../store/landingExperiment';

export default function SignupPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-primary/30" />}>
      <SignupExperiment />
    </Suspense>
  );
}

// Visitors in the redesign arm of the landing A/B test get the matching signup page. The control arm and
// visitors who never saw the landing (no variant cookie) keep the previous one.
function SignupExperiment() {
  const { variant, resolved, setVariant } = useLandingExperimentStore();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') === '/recipe' ? '/recipe' : '/';

  useEffect(() => {
    setVariant(getLandingVariant());
  }, [setVariant]);

  useEffect(() => {
    // redirectTo "/recipe" means the visitor came from "Gerar Receita" on the landing page
    trackPageVisit('signup', { redirectTo });
  }, [redirectTo]);

  if (!resolved) return <div className="min-h-screen" />;
  return variant === 'redesign' ? <Signup redirectTo={redirectTo} /> : <LegacySignup redirectTo={redirectTo} />;
}
