import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './', // Using relative paths is the safest way to avoid blank screens
})
