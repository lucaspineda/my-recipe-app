import React, { useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { initializeApp } from "firebase/app";
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation'


const ProtectedRoute = ({ children }) => {
  const firebaseConfig = {
    apiKey: "A",
    authDomain: "recipe-app-1bbdc.firebaseapp.com",
  };
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const pathname = usePathname()
  const router = useRouter();

  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log('logged in')
      } else {
        console.log('logged out')
      }
      checkRoute(user)
    });
  });

  const checkRoute = (user) => {
    if (!user) {
      router.push('/login');
      return null;
    }
    if((pathname.includes('/login') || pathname.includes('/signup')) && user) {
      router.push('/recipe');
      return null;
    }
  }
  return <div>{children}</div>;
};

export default ProtectedRoute;