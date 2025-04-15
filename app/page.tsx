"use client";

import { useState, useEffect } from 'react'
import Landing from './pages/Landing'
import { useRouter } from "next/navigation";
import {
  getAuth,
} from "firebase/auth";

export default function Init() {
  return (
    <>
      <Landing />
    </>
  );
}
