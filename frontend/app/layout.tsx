import type { Metadata } from 'next';
import { Inter, Manrope, Outfit } from 'next/font/google';
import './globals.css';
import { AuthProvider } from './auth/AuthContext';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const manrope = Manrope({ subsets: ['latin'], variable: '--font-manrope' });
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit', weight: ['400', '600', '700', '800'] });

export const metadata: Metadata = {
  title: 'HALO Support',
  description: 'AI-powered IT support platform — fast, intelligent, human.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${manrope.variable} ${outfit.variable} font-sans antialiased`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
