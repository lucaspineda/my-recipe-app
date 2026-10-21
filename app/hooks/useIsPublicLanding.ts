import { usePathname } from 'next/navigation';
import { useUserStore } from '../store/user';
import { useLandingExperimentStore } from '../store/landingExperiment';

// True on "/" while no user is loaded: the logged-out landing, which renders its own header and footer.
// The control arm of the landing A/B test is the previous page, which uses the global ones.
export function useIsPublicLanding() {
  const pathname = usePathname();
  const { user } = useUserStore();
  const { variant } = useLandingExperimentStore();
  return pathname === '/' && !user && variant !== 'control';
}
