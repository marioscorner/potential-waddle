import node from '@astrojs/node';
import react from '@astrojs/react';
import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'server',
  session: false,
  trailingSlash: 'always',
  adapter: node({ mode: 'middleware' }),
  integrations: [react()],
  vite: {
    server: {
      host: true,
    },
  },
});
