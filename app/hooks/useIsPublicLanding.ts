import { usePathname } from 'next/navigation';
import { useUserStore } from '../store/user';
import { useLandingExperimentStore } from '../store/landingExperiment';

// True on logged-out pages that render their own header and footer: the landing on "/" and, for visitors in
// the redesign arm of the landing A/B test, "/signup" and "/login". The control arm gets the previous pages,
// which use the global ones. All stay true until the variant is known so the global header doesn't flash in.
export function useIsPublicLanding() {
  const pathname = usePathname();
  const { user } = useUserStore();
  const { variant, resolved } = useLandingExperimentStore();
  if (user) return false;
  if (pathname === '/') return variant !== 'control';
  if (pathname === '/signup' || pathname === '/login') return !resolved || variant === 'redesign';
  return false;
}
