import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // Using relative paths so it deploys cleanly to GitHub Pages or any subpath
  server: {
    port: 3000,
    open: true
  }
});
