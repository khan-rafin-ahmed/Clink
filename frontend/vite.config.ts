import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// Enhanced Vite configuration for consistent local development
export default defineConfig({
  // Enable React fast refresh and JSX transform
  plugins: [react()],

  // Simplified alias to import from '@/...' instead of relative paths
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },

  // Development server configuration for consistent localhost experience
  server: {
    port: 3000,
    host: true, // Allow access from network (useful for mobile testing)
    strictPort: true, // Fail if port 3000 is already in use
    open: false, // Don't auto-open browser (can be annoying during development)
  },

  // Preview server configuration (for production builds)
  preview: {
    port: 3000,
    host: true,
    strictPort: true,
  },
})
