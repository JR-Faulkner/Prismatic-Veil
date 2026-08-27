import { defineConfig } from 'vite';

export default defineConfig({
  root: 'native-shell',
  base: './',
  publicDir: false,
  build: {
    outDir: '../dist-capacitor',
    emptyOutDir: true,
    sourcemap: true
  }
});
