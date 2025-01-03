import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { auth, useUserAuth } from "../../hooks/userAuth";

const ProtectedRoute = ({ children, onSetUser }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { getUser } = useUserAuth()

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        getUser()
        onSetUser(user)
        if(pathname === "/login" || pathname === "/signup" || pathname === "/password-reset") {
          router.push('/recipe')
        }
      }
      onSetUser(user)
      if (!user && pathname !== "/" && pathname !== "/signup" && pathname !== "/password-reset") {
        router.push("/login");
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
