'use client';
import { useEffect } from 'react';
import { trackPageVisit } from './lib/utils';
import Landing from './pages/Landing';

export default function Init() {
  useEffect(() => {
    trackPageVisit('landing');
  }, []);
  return (
    <>
      <Landing />
    </>
  );
}
