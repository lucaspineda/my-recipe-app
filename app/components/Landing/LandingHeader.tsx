'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChefHat } from 'lucide-react';

export default function LandingHeader() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-20 border-b bg-white/90 backdrop-blur transition-colors ${
        scrolled ? 'border-zinc-200' : 'border-transparent'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-8 md:h-[72px]">
        <Link href="/" className="flex items-center gap-2 rounded-lg text-lg font-bold tracking-[-0.01em] text-zinc-900">
          <ChefHat className="h-[22px] w-[22px] text-basil" aria-hidden="true" />
          Chefinho IA
        </Link>
        <nav aria-label="Conta">
          <ul className="flex items-center gap-1 text-[15px] font-medium text-zinc-900">
            <li>
              <Link href="/login" className="block rounded-[10px] px-3 py-2 hover:bg-zinc-100">
                Entrar
              </Link>
            </li>
            <li>
              <Link
                href="/signup"
                className="block rounded-[10px] border border-zinc-200 px-3.5 py-2 hover:border-zinc-300 hover:bg-zinc-50"
              >
                Criar conta
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
