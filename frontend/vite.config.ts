import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// Basic Vite configuration for React on Vercel
export default defineConfig({
  // Enable React fast refresh and JSX transform
  plugins: [react()],

  // Simplified alias to import from '@/...' instead of relative paths
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
})
