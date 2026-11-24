import { usePathname } from 'next/navigation';
import { useUserStore } from '../store/user';
import { useLandingExperimentStore } from '../store/landingExperiment';
import { useInitialRender } from '../components/ClientWrapper/InitialRender';

// True on logged-out pages that render their own header and footer: the landing on "/" and, for visitors in
// the redesign arm of the landing A/B test, "/signup" and "/login". The control arm gets the previous pages,
// which use the global ones. All stay true until the variant is known so the global header doesn't flash in.
// On "/" the server already knows the variant from its cookie, so the server HTML gets the right header.
export function useIsPublicLanding() {
  const pathname = usePathname();
  const { user } = useUserStore();
  const { variant, resolved } = useLandingExperimentStore();
  const { landingVariant } = useInitialRender();
  if (user) return false;
  if (pathname === '/') return (variant ?? landingVariant) !== 'control';
  if (pathname === '/signup' || pathname === '/login') return !resolved || variant === 'redesign';
  return false;
}
