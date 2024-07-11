'use client'
import { useState } from "react"
import { Rubik } from "next/font/google";
import MobileMenu from "./components/MobileMenu/MobileMenu";
import "./globals.css";

const rubik = Rubik({ subsets: ["latin"] });

export default function RootLayout({ children }) {
  // Todo: retrive loggendIn data from auth system
  const [isLoggedIn, setIsloggedIn] = useState(false)

  return (
    <html lang="en">
    <body className={rubik.className}>
        <div className="relative p-5">
          {isLoggedIn && <MobileMenu />}
          {children}
        </div>
      </body>
    </html>
  );
}
