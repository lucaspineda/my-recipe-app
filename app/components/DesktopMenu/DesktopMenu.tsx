import Link from 'next/link';
import * as React from 'react';
import { Utensils } from 'lucide-react';
import { useUserStore } from '../../store/user';
import { signOut, getAuth } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import Button from '../Button/Button';

export default function DesktopMenu() {
  const router = useRouter();
  const auth = getAuth();
  const { user } = useUserStore();

  const handleSignout = () => {
    router.push('/');
    signOut(auth).then(() => {
      router.push('/');
      console.log('user is signed out');
    });
  };

  return (
    <header className="flex justify-between items-center bg-[#f6e8d3] p-4 shadow-md text-base">
      <p className="flex items-center gap-2 text-lg">
        <Utensils className="text-red text-tertiary w-5 h-5" />
        <Link href="/" className="no-underline text-black">
          Chefinho IA
        </Link>
      </p>
      {user ? (
        <nav className="text-black">
          <ul className="flex gap-4">
            <li>
              <Link className="no-underline text-black font-normal" href="/recipe">
                Criar Receita
              </Link>
            </li>
            <li>
              <Link className="no-underline text-black font-normal" href="/plans">
                Meu Plano
              </Link>
            </li>
            <li>
              <Link className="no-underline text-black font-normal" href="/profile">
                Perfil
              </Link>
            </li>
            <li>
              <p className="no-underline text-black font-normal cursor-pointer" onClick={handleSignout}>
                Sair
              </p>
            </li>
          </ul>
        </nav>
      ) : (
        <nav className="text-black">
          <ul className="flex items-center gap-4">
            <li>
              <Link className="no-underline text-black font-normal" href="/signup">
                Criar conta
              </Link>
            </li>
            <li>
              <Button
                className="!py-2 px-4 w-min rounded-md border-none shadow-lg self-center text-sm"
                onClick={() => router.push('/login')}
              >
                Login
              </Button>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
