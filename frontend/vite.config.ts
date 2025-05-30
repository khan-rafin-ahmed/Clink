import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current directory.
  const env = loadEnv(mode, process.cwd(), '')
  
  // Debug log to check environment variables and .env file
  console.log('Vite config environment check:', {
    mode,
    cwd: process.cwd(),
    envFileExists: fs.existsSync('.env'),
    envFileContent: fs.existsSync('.env') ? fs.readFileSync('.env', 'utf-8') : 'No .env file found',
    envVars: {
      MAPBOX_TOKEN: env.VITE_MAPBOX_ACCESS_TOKEN ? 'present' : 'missing',
      MAPBOX_STYLE: env.VITE_MAPBOX_STYLE_URL ? 'present' : 'missing',
      API_URL: env.VITE_API_URL ? 'present' : 'missing',
      SUPABASE_URL: env.VITE_SUPABASE_URL ? 'present' : 'missing',
      SUPABASE_KEY: env.VITE_SUPABASE_ANON_KEY ? 'present' : 'missing'
    }
  })

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    // Expose env variables to the client
    define: {
      'import.meta.env.VITE_MAPBOX_ACCESS_TOKEN': JSON.stringify(env.VITE_MAPBOX_ACCESS_TOKEN),
      'import.meta.env.VITE_MAPBOX_STYLE_URL': JSON.stringify(env.VITE_MAPBOX_STYLE_URL || 'mapbox://styles/mapbox/dark-v11'),
      'import.meta.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL),
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY)
    }
  }
})
