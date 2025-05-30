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

  // Create a new object with the environment variables
  const envVars = {
    VITE_MAPBOX_ACCESS_TOKEN: env.VITE_MAPBOX_ACCESS_TOKEN || 'pk.eyJ1Ijoicm91Z2hpbiIsImEiOiJjbWJiMWh0a2YwdTVjMmtwcm5ubzI2MnpnIn0.zZ7-Pto8J7YiWZJzxf7kvQ',
    VITE_MAPBOX_STYLE_URL: env.VITE_MAPBOX_STYLE_URL || 'mapbox://styles/roughin/cmbb1ow4o001b01r0aux92662',
    VITE_API_URL: env.VITE_API_URL || 'http://localhost:3000',
    VITE_SUPABASE_URL: env.VITE_SUPABASE_URL || 'https://arpphimkotjvnfoacquj.supabase.co',
    VITE_SUPABASE_ANON_KEY: env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFycHBoaW1rb3Rqdm5mb2FjcXVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgyMDYwNjYsImV4cCI6MjA2Mzc4MjA2Nn0.GksQ0jn0RuJCAqDcP2m2B0Z5uPP7_y-efc2EqztrL3k'
  }
  
  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    // Expose env variables to the client
    define: {
      'import.meta.env.VITE_MAPBOX_ACCESS_TOKEN': JSON.stringify(envVars.VITE_MAPBOX_ACCESS_TOKEN),
      'import.meta.env.VITE_MAPBOX_STYLE_URL': JSON.stringify(envVars.VITE_MAPBOX_STYLE_URL),
      'import.meta.env.VITE_API_URL': JSON.stringify(envVars.VITE_API_URL),
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(envVars.VITE_SUPABASE_URL),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(envVars.VITE_SUPABASE_ANON_KEY)
    }
  }
})
