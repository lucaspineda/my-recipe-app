'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, BookOpen, ChefHat, ShoppingBag, User, Menu } from 'lucide-react';
import { useUserStore } from '../../store/user';
import { useState } from 'react';
import MobileMenuOpen from './MobileMenuOpen';

const navItems = [
  { href: '/minhas-receitas', label: 'Receitas', icon: BookOpen },
  { href: '/plans', label: 'Planos', icon: ShoppingBag },
  { href: '/recipe', label: 'Criar', icon: ChefHat },
  { href: '/profile', label: 'Perfil', icon: User },
];

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { user } = useUserStore();
  const [menuOpen, setMenuOpen] = useState(false);

  if (!user) return null;

  const toggleMenu = () => setMenuOpen(!menuOpen);

  return (
    <>
      {/* Spacer to prevent content from being hidden behind the nav */}
      <div className="h-20 lg:hidden" />

      {menuOpen && <MobileMenuOpen toggleMenu={toggleMenu} />}

      {!menuOpen && (
        <nav className="fixed bottom-4 left-0 right-0 z-30 lg:hidden flex justify-center px-4">
          <div className="bg-secondary rounded-2xl px-2 py-2 grid grid-cols-5 border-2 border-tertiary/40 shadow-[0_4px_20px_rgba(0,0,0,0.3)] w-full max-w-md">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href === '/recipe' && pathname === '/');

            if (isActive) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="no-underline -mt-6 flex flex-col items-center justify-center"
                >
                  <div className="w-14 h-14 rounded-full bg-tertiary flex items-center justify-center shadow-lg border-4 border-secondary">
                    <item.icon className="w-6 h-6 text-white" strokeWidth={2.5} />
                  </div>
                  <span className="text-[10px] mt-0.5 text-primary/80 font-medium">
                    {item.label}
                  </span>
                </Link>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className="no-underline flex flex-col items-center justify-center py-1.5"
              >
                <item.icon
                  className="w-5 h-5 text-primary/50"
                  strokeWidth={1.5}
                />
                <span className="text-[10px] mt-1 font-medium text-primary/50">
                  {item.label}
                </span>
              </Link>
            );
          })}

          {/* More menu button */}
          <button
            onClick={toggleMenu}
            className="flex flex-col items-center justify-center py-1.5 bg-transparent border-none cursor-pointer"
          >
            <Menu className="w-5 h-5 text-primary/50" strokeWidth={1.5} />
            <span className="text-[10px] mt-1 font-medium text-primary/50">Mais</span>
          </button>
        </div>
      </nav>
      )}
    </>
  );
}
