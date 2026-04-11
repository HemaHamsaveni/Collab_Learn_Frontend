import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // This tells Vite to treat 'global' as 'window' for older Node.js packages like sockjs
  define: {
    global: 'window',
  },
})