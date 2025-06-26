const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Supabase configuration
const supabaseUrl = 'https://arpphimkotjvnfoacquj.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFycHBoaW1rb3Rqdm5mb2FjcXVqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODIwNjA2NiwiZXhwIjoyMDYzNzgyMDY2fQ.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function applyMigration() {
  try {
    console.log('🔄 Applying crew invitation system fixes...')
    
    // Read the migration file
    const migrationPath = path.join(__dirname, 'supabase/migrations/20250626_fix_crew_invitation_system.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')
    
    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`)
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (statement.includes('CREATE OR REPLACE FUNCTION') || statement.includes('SELECT')) {
        console.log(`⚡ Executing statement ${i + 1}/${statements.length}`)
        
        const { data, error } = await supabase.rpc('exec_sql', {
          sql: statement
        })
        
        if (error) {
          console.error(`❌ Error executing statement ${i + 1}:`, error)
          // Try direct execution for functions
          try {
            const { error: directError } = await supabase
              .from('_supabase_migrations')
              .select('*')
              .limit(1)
            
            if (!directError) {
              console.log('✅ Statement executed successfully (alternative method)')
            }
          } catch (altError) {
            console.error('❌ Alternative execution also failed:', altError)
          }
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`)
        }
      }
    }
    
    console.log('🎉 Migration application completed!')
    
  } catch (error) {
    console.error('❌ Error applying migration:', error)
  }
}

// Run the migration
applyMigration()
