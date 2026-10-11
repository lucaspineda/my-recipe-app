import { Bricolage_Grotesque } from 'next/font/google';

// Display face for the landing page headlines; the rest of the app stays on Rubik.
export const displayFont = Bricolage_Grotesque({
  subsets: ['latin'],
  axes: ['wdth', 'opsz'],
  variable: '--font-display',
  display: 'swap',
});
