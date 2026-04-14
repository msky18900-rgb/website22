import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Use your EXACT repository name here
  base: '/website22/', 
  build: {
    outDir: 'dist',
  }
})
