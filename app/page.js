"use client";

import { useState } from 'react'
import Home from './pages/Home.js'
import Landing from './pages/Landing.js'

export default function Init() {

  // Todo: retrive loggendIn data from auth system
  const [isLoggedIn, setIsloggedIn] = useState(false)

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
