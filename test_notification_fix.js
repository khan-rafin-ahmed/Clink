// Test script to apply the notification fix migration
// This script will execute the SQL migration directly through Supabase client

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const supabaseUrl = 'https://arpphimkotjvnfoacquj.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFycHBoaW1rb3Rqdm5mb2FjcXVqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODIwNjA2NiwiZXhwIjoyMDYzNzgyMDY2fQ.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function applyNotificationFix() {
  try {
    console.log('🔧 Applying notification fix migration...')

    // Read the migration file
    const migrationSQL = fs.readFileSync('./supabase/migrations/20250111_fix_duplicate_notifications.sql', 'utf8')

    // Split the migration into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))

    console.log(`📝 Found ${statements.length} SQL statements to execute`)

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (statement.trim()) {
        console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`)
        console.log(`📄 Statement: ${statement.substring(0, 100)}...`)

        const { data, error } = await supabase.rpc('exec_sql', {
          sql: statement + ';'
        })

        if (error) {
          console.error(`❌ Error executing statement ${i + 1}:`, error)
          console.error(`📄 Failed statement: ${statement}`)
          // Continue with other statements
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`)
        }
      }
    }

    console.log('🎉 Migration application completed!')

    // Test the fix by checking for existing malformed notifications
    console.log('🔍 Checking for malformed notifications...')
    const { data: malformedNotifications, error: checkError } = await supabase
      .from('notifications')
      .select('id, title, type')
      .ilike('title', '%you invited you%')

    if (checkError) {
      console.error('❌ Error checking notifications:', checkError)
    } else {
      console.log(`📊 Found ${malformedNotifications?.length || 0} malformed notifications`)
      if (malformedNotifications && malformedNotifications.length > 0) {
        console.log('🗑️ These should be cleaned up by the migration')
      }
    }

  } catch (error) {
    console.error('❌ Failed to apply migration:', error)
  }
}

// Run the migration
applyNotificationFix()