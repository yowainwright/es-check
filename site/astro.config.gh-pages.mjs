import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';

import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://jeffry.in',
  base: '/es-check/',
  integrations: [mdx(), react()],
  trailingSlash: 'never',
  
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      include: ['react', 'react-dom', 'fuse.js'],
    },
    ssr: {
      noExternal: ['@fontsource-variable/*'],
    },
  },
});