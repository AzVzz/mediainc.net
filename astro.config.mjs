import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  output: 'static',
  site: 'https://mediainc.net',
  integrations: [sitemap()],
  image: {
    domains: ['residente.mx'],
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
