// app/layout.tsx
import './globals.css';
import { Rubik } from 'next/font/google';
import ClientWrapper from './components/ClientWrapper';
const rubik = Rubik({ subsets: ['latin'] });
import { GoogleAnalytics } from '@next/third-parties/google';
import { GoogleTagManager } from '@next/third-parties/google';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Footer from './components/Footer/Footer';

export const viewport = {
  themeColor: '#0f6374',
};

export const metadata = {
  metadataBase: new URL('https://chefinhoia.com.br'),
  title: 'Chefinho IA - Criador de receitas com IA',
  description: 'Crie receitas com os ingredientes que você já tem em casa, usando o poder da Inteligência Artificial!',
  openGraph: {
    title: 'Chefinho IA',
    description: 'Receitas inteligentes com IA para o seu dia a dia.',
    url: 'https://chefinhoia.com.br/',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Chefinho IA',
    description: 'Descubra receitas personalizadas com inteligência artificial.',
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/icons/icon-192x192.png',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Chefinho IA',
  },
};

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Chefinho IA',
  url: 'https://chefinhoia.com.br',
  logo: 'https://chefinhoia.com.br/icons/icon-512x512.png',
  description:
    'Crie receitas com os ingredientes que você já tem em casa, usando o poder da Inteligência Artificial.',
};

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Chefinho IA',
  url: 'https://chefinhoia.com.br',
  inLanguage: 'pt-BR',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body className={`${rubik.className} flex flex-col min-h-screen`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID}>
          <ClientWrapper>{children}</ClientWrapper>
          <Footer />
        </GoogleOAuthProvider>
      </body>
      <GoogleAnalytics gaId="G-CX5QCT2T50" />
      <GoogleTagManager gtmId="AW-1707145258" />
    </html>
  );
}
