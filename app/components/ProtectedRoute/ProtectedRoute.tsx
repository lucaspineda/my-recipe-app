import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { auth, useUserAuth } from '../../hooks/userAuth';
import { useUserStore } from '../../store/user';

const ProtectedRoute = ({ children, onSetUser }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { getUser } = useUserAuth();
  const { setUser } = useUserStore();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      console.log(user, 'userr');
      if (user) {
        getUser();
        onSetUser(user);

        if (pathname === '/login' || pathname === '/signup' || pathname === '/password-reset') {
          router.push('/recipe');
        }
      }
      if (!user && pathname !== '/' && pathname !== '/signup' && pathname !== '/password-reset') {
        setUser(null);
        router.push('/login');
        return null;
      }
    });

    return () => {
      unsubscribe();
    };
  }, [onSetUser, pathname, router]);

  return <div>{children}</div>;
};

export default ProtectedRoute;
