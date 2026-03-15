'use client';

import { useEffect, useState } from 'react';
import { Bounce, ToastContainer } from 'react-toastify';
import DesktopMenu from '../DesktopMenu/DesktopMenu';
import MobileMenu from '../MobileMenu/MobileMenu';
import MobileBottomNav from '../MobileMenu/MobileBottomNav';
import ProtectedRoute from '../ProtectedRoute/ProtectedRoute';
import Clarity from '@microsoft/clarity';
import TagManager from 'react-gtm-module';
import Hotjar from '@hotjar/browser';
import { useUserStore } from '../../store/user';
import { captureUtmParams } from '../../lib/analytics';

const siteId = 6525527;
const hotjarVersion = 6;

const tagManagerArgs = {
  gtmId: 'GTM-T7SJQKP2',
};
export default function ClientWrapper({ children }: { children: React.ReactNode }) {
  const { user } = useUserStore();
  const projectId = 'rnup5ef83c';

  useEffect(() => {
    captureUtmParams();
    console.log('init gtm');
    TagManager.initialize(tagManagerArgs);
    Hotjar.init(siteId, hotjarVersion);
    Clarity.init(projectId);
  }, []);

  useEffect(() => {
    // Identify user in Hotjar and Clarity when user data is available
    if (user?.email && user?.uid) {
      Hotjar.identify(user.uid, {
        email: user.email,
      });
      
      Clarity.identify(user.uid, undefined, undefined, user.name);
      Clarity.setTag('email', user.email);
      if (user.name) {
        Clarity.setTag('name', user.name);
      }
    }
  }, [user]);

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
        <MobileMenu />
      </div>
      <div className="relative p-5">{children}</div>
      <MobileBottomNav />
    </ProtectedRoute>
  );
}
