'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Login from '../pages/Login';
import LegacyLogin from '../pages/LegacyLogin';
import { getLandingVariant } from '../lib/landingExperiment';
import { trackPageVisit } from '../lib/analytics';
import { useLandingExperimentStore } from '../store/landingExperiment';

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-primary/30" />}>
      <LoginExperiment />
    </Suspense>
  );
}

// Visitors in the redesign arm of the landing A/B test get the matching login page. The control arm and
// visitors who never saw the landing (no variant cookie) keep the previous one.
function LoginExperiment() {
  const { variant, resolved, setVariant } = useLandingExperimentStore();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') === '/recipe' ? '/recipe' : '/';

  useEffect(() => {
    setVariant(getLandingVariant());
  }, [setVariant]);

  useEffect(() => {
    trackPageVisit('login');
  }, []);

  if (!resolved) return <div className="min-h-screen" />;
  return variant === 'redesign' ? <Login redirectTo={redirectTo} /> : <LegacyLogin redirectTo={redirectTo} />;
}
