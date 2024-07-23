"use client";
import { useState } from "react";
import { Rubik } from "next/font/google";
import MobileMenu from "./components/MobileMenu/MobileMenu";
import { IconMenu2 } from "@tabler/icons-react";
import "./globals.css";
IconMenu2;
const rubik = Rubik({ subsets: ["latin"] });

export default function RootLayout({ children }) {
  // Todo: retrive loggendIn data from auth system
  const [isLoggedIn, setIsloggedIn] = useState(true);
  const [openMenu, setOpenMenu] = useState(false);

  const toggleMenu = () => {
    setOpenMenu(!openMenu);
  };

  return (
    <html lang="en">
      <body className={rubik.className}>
        {isLoggedIn && (
          <IconMenu2
            className="absolute top-4 right-4 z-10"
            size={30}
            stroke={2}
            onClick={() => setOpenMenu(true)}
          />
        )}
        {openMenu && <MobileMenu toggleMenu={toggleMenu} />}
        <div className="relative p-5">{children}</div>
      </body>
    </html>
  );
}
