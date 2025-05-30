import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current directory.
  const env = loadEnv(mode, process.cwd(), '')
  
  // Debug environment variables
  console.log('Current mode:', mode)
  console.log('Working directory:', process.cwd())
  console.log('.env file exists:', fs.existsSync('.env'))
  console.log('Environment variables:')
  console.log('- VITE_GOOGLE_MAPS_API_KEY:', env.VITE_GOOGLE_MAPS_API_KEY ? 'Present' : 'Missing')
  console.log('- VITE_API_URL:', env.VITE_API_URL ? 'Present' : 'Missing')
  console.log('- VITE_SUPABASE_URL:', env.VITE_SUPABASE_URL ? 'Present' : 'Missing')
  console.log('- VITE_SUPABASE_ANON_KEY:', env.VITE_SUPABASE_ANON_KEY ? 'Present' : 'Missing')

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    // Expose env variables to the client
    define: {
      'process.env': {
        VITE_GOOGLE_MAPS_API_KEY: JSON.stringify(env.VITE_GOOGLE_MAPS_API_KEY || ''),
        VITE_API_URL: JSON.stringify(env.VITE_API_URL || ''),
        VITE_SUPABASE_URL: JSON.stringify(env.VITE_SUPABASE_URL || ''),
        VITE_SUPABASE_ANON_KEY: JSON.stringify(env.VITE_SUPABASE_ANON_KEY || ''),
      },
    }
  }
})
