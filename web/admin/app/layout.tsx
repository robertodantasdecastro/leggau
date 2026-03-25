import './globals.css';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'Leggau Admin',
  description: 'Painel operacional e comercial do Leggau.',
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>
        <div className="wrap">{children}</div>
      </body>
    </html>
  );
}
