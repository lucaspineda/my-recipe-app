'use client';
import { useEffect, useState } from 'react';
import LandingExperiment from './pages/LandingExperiment';
import HomeDashboard from './components/HomeDashboard/HomeDashboard';
import { auth } from './hooks/userAuth';
import { useUserStore } from './store/user';
import { useInitialRender } from './components/ClientWrapper/InitialRender';

export default function Init() {
  const { user } = useUserStore();
  const { signedInHint } = useInitialRender();
  const [authResolved, setAuthResolved] = useState(false);
  const isAuthenticated = Boolean(auth.currentUser);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(() => {
      setAuthResolved(true);
    });

    return () => unsubscribe();
  }, []);

  if (user) return <HomeDashboard />;

  // Signed in, profile still loading; or this browser was signed in last time and Firebase Auth hasn't loaded yet
  if (isAuthenticated || (signedInHint && !authResolved)) {
    return <div className="min-h-screen bg-primary/30" />;
  }

  // Everyone else gets the landing page straight away, already in the server HTML, without waiting for Auth.
  // If Auth then finds a user, the branches above take over.
  return <LandingExperiment />;
}
