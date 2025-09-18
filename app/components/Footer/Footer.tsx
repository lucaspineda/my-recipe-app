import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-secondary mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
          <div className="text-center md:text-left">
            <h3 className="text-white font-semibold mb-2">Chefinho IA</h3>
            <p className="text-sm text-white/90">Receitas personalizadas com IA</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-white/90">© 2025 Chefinho IA. Todos os direitos reservados.</p>
          </div>
          <div className="flex justify-center md:justify-end space-x-8">
            <Link 
              href="/terms" 
              className="text-sm text-white hover:text-white/80 transition-colors duration-200 no-underline"
            >
              Termos de Uso
            </Link>
            <Link 
              href="/privacy" 
              className="text-sm text-white hover:text-white/80 transition-colors duration-200 no-underline"
            >
              Política de Privacidade
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
