'use client';
import { useEffect, useState } from 'react';
import Landing from './pages/Landing';
import HomeDashboard from './components/HomeDashboard/HomeDashboard';
import { auth } from './hooks/userAuth';
import { useUserStore } from './store/user';

export default function Init() {
  const { user } = useUserStore();
  const [authResolved, setAuthResolved] = useState(false);
  const isAuthenticated = Boolean(auth.currentUser);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(() => {
      setAuthResolved(true);
    });

    return () => unsubscribe();
  }, []);

  if (!authResolved || (isAuthenticated && !user)) {
    return <div className="min-h-screen bg-primary/30" />;
  }

  return (
    <>
      {user ? <HomeDashboard /> : <Landing />}
    </>
  );
}
