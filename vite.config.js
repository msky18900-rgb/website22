import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Replace 'website22' with your EXACT repo name on GitHub
  base: '/website22/', 
})
