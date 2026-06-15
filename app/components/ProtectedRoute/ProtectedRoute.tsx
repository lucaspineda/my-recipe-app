import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { auth, useUserAuth } from '../../hooks/userAuth';
import { useUserStore } from '../../store/user';

const ProtectedRoute = ({ children }: { children: React.ReactNode; }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { getUser } = useUserAuth();
  const { setUser } = useUserStore();
  
  const alwaysPublicPaths = ['/terms', '/privacy', '/plans-public'];
  const alwaysPublicPrefixes = ['/recipe/'];
  const authPublicPaths = ['/login', '/signup', '/password-reset'];
  
  const isAlwaysPublic = alwaysPublicPaths.includes(pathname) || 
    alwaysPublicPrefixes.some(prefix => pathname?.startsWith(prefix));
  
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      console.log(user, 'user')
      if (user) {
        await getUser();

        if (authPublicPaths.includes(pathname)) {
          router.push('/');
        }
      } else if (!isAlwaysPublic && !authPublicPaths.includes(pathname)) {
        setUser(null);
        router.push('/login');
      }
    });

    return () => {
      unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, router]);

  return <div>{children}</div>;
};

export default ProtectedRoute;
