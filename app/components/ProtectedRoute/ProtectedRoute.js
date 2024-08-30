import React, { useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { initializeApp } from "firebase/app";
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation'
import useAuth from '../../hooks/user' 

const ProtectedRoute = ({ children }) => {

  const pathname = usePathname()
  const router = useRouter();
  const user = useAuth()
  console.log('userrr')

  // useEffect(() => {
  //   checkRoute(user)
  // }, [user]);

  const checkRoute = (user) => {
    if (!user && pathname !== '/') {
      console.log('caiu aquiii', pathname)
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