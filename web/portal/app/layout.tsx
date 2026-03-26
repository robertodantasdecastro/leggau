import './globals.css';
import Link from 'next/link';
import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { PortalPwa } from '../components/portal-pwa';

export const metadata: Metadata = {
  title: 'Leggau',
  description:
    'Portal do Leggau para pais, profissionais e distribuicao do app infantil.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'Leggau Portal',
    statusBarStyle: 'default',
  },
  icons: {
    icon: '/portal-icon.svg',
    apple: '/portal-icon.svg',
  },
};

export const viewport: Viewport = {
  themeColor: '#f7f1df',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

const navLinks = [
  { href: '/', label: 'Inicio' },
  { href: '/pais', label: 'Para pais' },
  { href: '/profissionais', label: 'Para profissionais' },
  { href: '/download', label: 'Download' },
  { href: '/privacidade', label: 'Privacidade' },
  { href: '/termos', label: 'Termos' },
  { href: '/contato', label: 'Contato' },
  { href: '/admin', label: 'Admin' },
];

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>
        <PortalPwa />
        <div className="shell">
          <header className="nav">
            <Link href="/" className="brand">
              Leggau
            </Link>
            <nav className="links">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href}>
                  {link.label}
                </Link>
              ))}
            </nav>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
