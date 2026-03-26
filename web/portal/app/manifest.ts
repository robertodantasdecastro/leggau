import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Leggau Portal',
    short_name: 'Leggau',
    description:
      'Portal responsivo do Leggau para pais e profissionais, com supervisao, convites e fluxos clinicos online-first.',
    start_url: '/pais',
    display: 'standalone',
    background_color: '#f7f1df',
    theme_color: '#f7f1df',
    orientation: 'portrait',
    icons: [
      {
        src: '/portal-icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/portal-icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
    ],
  };
}
