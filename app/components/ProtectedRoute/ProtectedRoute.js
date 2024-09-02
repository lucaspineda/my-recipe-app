import React, { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { initializeApp } from "firebase/app";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
// import useAuth from "../../hooks/user";

const ProtectedRoute = ({ children }) => {
  const firebaseConfig = {
    apiKey: "A",
    authDomain: "recipe-app-1bbdc.firebaseapp.com",
  };
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const pathname = usePathname();
  const router = useRouter();

  const checkRoute = (user) => {
    if (!user && pathname !== "/") {
      console.log("caiu aquiii", pathname);
      router.push("/login");
      return null;
    }
    // if((pathname.includes('/login') || pathname.includes('/signup')) && user) {
    //   router.push('/recipe');
    //   return null;
    // }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user && pathname !== "/") {
        router.push("/login");
        return null;
      }
    });

    return () => {
      unsubscribe();
    };
  }, [auth, pathname, router]);

  return <div>{children}</div>;
};

export default ProtectedRoute;
