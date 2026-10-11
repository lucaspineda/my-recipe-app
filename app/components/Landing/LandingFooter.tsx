import Link from 'next/link';
import { ChefHat } from 'lucide-react';

export default function LandingFooter() {
  return (
    <footer className="border-t border-zinc-200 px-4 py-10 sm:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 text-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="flex items-center gap-2 text-base font-bold text-zinc-900">
            <ChefHat className="h-5 w-5 text-basil" aria-hidden="true" />
            Chefinho IA
          </p>
          <p className="mt-1 text-zinc-600">Receitas personalizadas com IA</p>
        </div>
        <nav aria-label="Informações legais" className="flex gap-6 text-zinc-900">
          <Link href="/terms" className="hover:underline">
            Termos de Uso
          </Link>
          <Link href="/privacy" className="hover:underline">
            Política de Privacidade
          </Link>
        </nav>
        <p className="text-zinc-600">© 2025 Chefinho IA. Todos os direitos reservados.</p>
      </div>
    </footer>
  );
}
