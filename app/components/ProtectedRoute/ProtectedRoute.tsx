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
  
  const alwaysPublicPaths = ['/terms', '/privacy'];
  const authPublicPaths = ['/', '/login', '/signup', '/password-reset'];
  
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        getUser();

        if (authPublicPaths.includes(pathname)) {
          router.push('/recipe');
        }
      }
      if (!user && !alwaysPublicPaths.includes(pathname) && !authPublicPaths.includes(pathname)) {
        setUser(null);
        router.push('/login');
        return null;
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
