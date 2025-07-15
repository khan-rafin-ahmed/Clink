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

  // Build optimization for production
  build: {
    // Increase chunk size warning limit to 1MB (from default 500KB)
    chunkSizeWarningLimit: 1000,

    // Enable code splitting for better performance
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate vendor libraries into their own chunks
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['lucide-react', 'framer-motion', '@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          'supabase-vendor': ['@supabase/supabase-js'],
          'utils-vendor': ['date-fns', 'clsx', 'tailwind-merge'],
        },
      },
    },
  },
})
