"use client";

import { useState, useEffect } from 'react'
import Landing from './pages/Landing'
import { useRouter } from "next/navigation";
import {
  getAuth,
} from "firebase/auth";

export default function Init() {
  const auth = getAuth();
  const router = useRouter();

  // Todo: retrive loggendIn data from auth system
  useEffect(() => {
    auth.onAuthStateChanged((user) => {
      if (user) {
        router.push("/recipe");
      }
    });
  }, [auth, router]);

  return (
    <>
      <Landing />
    </>
  );
}
