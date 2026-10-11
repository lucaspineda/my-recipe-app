import { usePathname } from 'next/navigation';
import { useUserStore } from '../store/user';

// True on "/" while no user is loaded: the logged-out landing, which renders its own header and footer.
export function useIsPublicLanding() {
  const pathname = usePathname();
  const { user } = useUserStore();
  return pathname === '/' && !user;
}
