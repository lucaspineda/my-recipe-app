// app/layout.tsx
import './globals.css';
import { Rubik } from 'next/font/google';
import ClientWrapper from './components/ClientWrapper';
const rubik = Rubik({ subsets: ['latin'] });
import { GoogleAnalytics } from '@next/third-parties/google'
import { GoogleTagManager } from '@next/third-parties/google'

import { Metadata } from 'next';

export const metadata = {
  title: 'Chefinho IA - Criador de receitas com IA',
  keywords: 'receitas, inteligência artificial, IA, comida, culinária, receitas personalizadas, comidas saudáveis, receita para almoço, receita para jantar, receitas fáceis, receitas rápidas',
  description: 'Crie receitas com os ingredientes que você já tem em casa, usando o poder da Inteligência Artificial!',
  openGraph: {
    title: 'Chefinho IA',
    description: 'Receitas inteligentes com IA para o seu dia a dia.',
    url: 'https://www.chefinhoia.com.br/',
    type: 'website',
    images: ['https://www.chefinhoia.com.br/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Chefinho IA',
    description: 'Descubra receitas personalizadas com inteligência artificial.',
    images: ['https://www.chefinhoia.com.br/og-image.png'],
  },
  icons: {
    icon: '/icon.ico',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body className={rubik.className}>
        <ClientWrapper>{children}</ClientWrapper>
      </body>
      <GoogleAnalytics gaId="G-CX5QCT2T50" />
      <GoogleTagManager gtmId="AW-1707145258" />
    </html>
  );
}
