import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  output: 'static',
  site: 'https://mediainc.net',
  image: {
    domains: ['residente.mx'],
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
