import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  publicDir: false,
  server: {
    strictPort: true,
    port: 5173
  },
  preview: {
    strictPort: true,
    port: 4173
  },
  build: {
    outDir: 'dist-modernization',
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      input: 'modernization-probe.html'
    }
  }
});
