'use client';

import { useState } from 'react';
import { Bounce, ToastContainer } from 'react-toastify';
import DesktopMenu from '../DesktopMenu/DesktopMenu';
import MobileMenu from '../MobileMenu/MobileMenu';
import MobileMenuOpen from '../MobileMenu/MobileMenuOpen';
import ProtectedRoute from '../ProtectedRoute/ProtectedRoute';
import WhatsAppButton from '../WhatsApp/WhatsApp';
import Clarity from '@microsoft/clarity';

export default function ClientWrapper({ children }: { children: React.ReactNode }) {
  const [openMenu, setOpenMenu] = useState(false);

  const toggleMenu = () => setOpenMenu(!openMenu);

  const handleIconClick = () => {
    toggleMenu();
  };
  const projectId = 'rnup5ef83c';

  Clarity.init(projectId);

  return (
    <ProtectedRoute>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick={false}
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
        transition={Bounce}
      />
      <div className="hidden sticky z-20 top-0 lg:block">
        <DesktopMenu />
      </div>
      <div className="sticky z-20 top-0 lg:hidden">
        <MobileMenu toggleMenu={handleIconClick} />
      </div>
      {openMenu && <MobileMenuOpen toggleMenu={toggleMenu} />}
      <div className="relative p-5">{children}</div>
      <WhatsAppButton />
    </ProtectedRoute>
  );
}
