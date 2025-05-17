// app/layout.tsx
import './globals.css';
import { Rubik } from 'next/font/google';
import ClientWrapper from './components/ClientWrapper';
const rubik = Rubik({ subsets: ['latin'] });
import { Metadata } from 'next';
import Head from 'next/head';

export const metadata = {
  title: 'Chefinho IA - Seu assistente para criar receitas com inteligência artificial',
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
    </html>
  );
}
