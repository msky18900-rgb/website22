import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Replace 'website22' with your exact repository name on GitHub
  base: '/website22/',
  build: {
    // This ensures the output folder matches what our deploy.yml expects
    outDir: 'dist',
    // This helps prevent MIME type errors by organizing assets correctly
    assetsDir: 'assets',
  },
})
