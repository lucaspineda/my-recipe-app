"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from 'react'
import Home from './pages/Home.js'
import Landing from './pages/Landing.js'
// import PeopleCookingImg from "./../public/people-cooking.svg"

export default function Init() {

  const [isLoggedIn, setIsloggedIn] = useState(true)
  const targetRef = useRef(null);
  const router = useRouter();
  const handleSignupClick = () => {
    targetRef.current.scrollIntoView({ behavior: "smooth" });
  };
  return (
    <>
    {
      isLoggedIn ? (
        <div>
          <Home />
        </div>
      ) : (
        <Landing />
      )
    }
    </>
  );
}
