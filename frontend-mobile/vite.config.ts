import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    outDir: '../build/frontend-mobile',
    emptyOutDir: true,
  },
  server: {
    port: 34115,
    strictPort: true,
  },
})