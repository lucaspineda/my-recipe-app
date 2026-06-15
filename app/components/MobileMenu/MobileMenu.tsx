import { Utensils } from 'lucide-react';
import Link from 'next/link';
import { useUserStore } from '../../store/user';
import { useRouter } from 'next/navigation';
import Button from '../Button/Button';

export default function MobileMenu() {
  const router = useRouter();
  const { user } = useUserStore();

  return (
    <header className="flex justify-between items-center bg-[#f6e8d3] p-3 shadow-md text-base">
      <p className="flex items-center gap-2 text-lg">
        <Utensils className="text-red text-tertiary w-5 h-5" />
        <Link href="/" className="no-underline text-black">
          Chefinho IA
        </Link>
      </p>
      {!user && (
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
