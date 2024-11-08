import React, { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { initializeApp } from "firebase/app";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
// import useAuth from "../../hooks/user";

const ProtectedRoute = ({ children, onSetUser }) => {
  const firebaseConfig = {
    apiKey: "AIzaSyAUTRpjufvz16h_B-1a9S-zk5r-3-b6wBY",
    authDomain: "recipe-app-1bbdc.firebaseapp.com",
  };
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const pathname = usePathname();
  const router = useRouter();

  console.log(auth, 'auth')

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        onSetUser(user)
      }
      onSetUser(user)
      if (!user && pathname !== "/" && pathname !== "/signup") {
        router.push("/login");
        return null;
      }
    });

    return () => {
      unsubscribe();
    };
  }, [auth, onSetUser, pathname, router]);

  return <div>{children}</div>;
};

export default ProtectedRoute;
