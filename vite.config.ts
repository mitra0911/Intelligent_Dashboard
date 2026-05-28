import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    sourcemap: false,
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/recharts')) return 'recharts'
          if (id.includes('node_modules/react-dom')) return 'react-dom'
          if (id.includes('node_modules/react-router')) return 'router'
          if (id.includes('node_modules/react/')) return 'react'
        },
      },
    },
  },
})
