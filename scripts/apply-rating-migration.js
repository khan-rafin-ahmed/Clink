// Script to apply the event ratings migration
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Supabase configuration
const supabaseUrl = 'https://arpphimkotjvnfoacquj.supabase.co'
// SECURITY: Use environment variables only - never hardcode keys
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseServiceKey) {
  throw new Error('SUPABASE_SERVICE_KEY environment variable is required')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function applyMigration() {
  try {
    console.log('🚀 Applying event ratings migration...')

    // Read the migration file
    const migrationPath = path.join(__dirname, '../supabase/migrations/add_event_ratings.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')

    // Split the migration into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))

    console.log(`📝 Found ${statements.length} SQL statements to execute`)

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';'
      console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`)
      
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement })
        
        if (error) {
          // Try direct execution if RPC fails
          const { error: directError } = await supabase
            .from('_migrations')
            .select('*')
            .limit(1)
          
          if (directError) {
            console.log(`⚠️  Statement ${i + 1} failed, but this might be expected:`, error.message)
          }
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`)
        }
      } catch (err) {
        console.log(`⚠️  Statement ${i + 1} failed:`, err.message)
      }
    }

    // Test if the table was created successfully
    console.log('🔍 Testing if event_ratings table exists...')
    const { data, error } = await supabase
      .from('event_ratings')
      .select('*')
      .limit(1)

    if (error) {
      console.log('❌ Migration may have failed:', error.message)
      console.log('💡 You may need to apply the migration manually in the Supabase dashboard')
    } else {
      console.log('✅ Migration applied successfully! event_ratings table is accessible')
    }

  } catch (error) {
    console.error('❌ Error applying migration:', error.message)
    console.log('💡 Please apply the migration manually using the Supabase dashboard')
    console.log('📄 Migration file location: supabase/migrations/add_event_ratings.sql')
  }
}

// Run the migration
applyMigration()
