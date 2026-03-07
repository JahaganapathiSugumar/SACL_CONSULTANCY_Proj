import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 9011,
    proxy: {
      '/api': {
        target: 'http://localhost:9012',
        changeOrigin: true,
      },
    },
  },
})
