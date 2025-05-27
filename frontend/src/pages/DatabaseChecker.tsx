import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export function DatabaseChecker() {
  const [results, setResults] = useState<any>(null)
  const [isChecking, setIsChecking] = useState(false)

  const checkDatabase = async () => {
    setIsChecking(true)
    const checks: any = {
      timestamp: new Date().toISOString(),
      tables: {},
      permissions: {},
      sampleData: {}
    }

    try {
      // Check if events table exists and its structure
      try {
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .limit(1)

        if (error) {
          checks.tables.events = `Error: ${error.message}`
        } else {
          checks.tables.events = 'Table exists and accessible'
          checks.sampleData.eventsCount = data?.length || 0
        }
      } catch (err: any) {
        checks.tables.events = `Exception: ${err.message}`
      }

      // Check if rsvps table exists
      try {
        const { data, error } = await supabase
          .from('rsvps')
          .select('*')
          .limit(1)

        if (error) {
          checks.tables.rsvps = `Error: ${error.message}`
        } else {
          checks.tables.rsvps = 'Table exists and accessible'
          checks.sampleData.rsvpsCount = data?.length || 0
        }
      } catch (err: any) {
        checks.tables.rsvps = `Exception: ${err.message}`
      }

      // Check table structure
      try {
        const { data, error } = await supabase
          .rpc('get_table_columns', { table_name: 'events' })

        if (error) {
          // Fallback: try to describe table structure by querying with limit 0
          const { error: structureError } = await supabase
            .from('events')
            .select('*')
            .limit(0)

          if (structureError) {
            checks.tables.eventsStructure = `Error: ${structureError.message}`
          } else {
            checks.tables.eventsStructure = 'Table accessible but cannot get column info'
          }
        } else {
          checks.tables.eventsStructure = data
        }
      } catch (err: any) {
        checks.tables.eventsStructure = `Exception: ${err.message}`
      }

      // Test creating an event
      try {
        const user = (await supabase.auth.getUser()).data.user
        if (!user) {
          checks.permissions.createEvent = 'Not logged in - cannot test'
        } else {
          const testEvent = {
            title: 'Test Event',
            location: 'Test Location',
            date_time: new Date().toISOString(),
            notes: 'Test notes',
            drink_type: 'beer',
            vibe: 'casual',
            created_by: user.id
          }

          console.log('Testing event creation with:', testEvent)

          const { data, error } = await supabase
            .from('events')
            .insert(testEvent)
            .select()
            .single()

          if (error) {
            checks.permissions.createEvent = `Error: ${error.message}`
            checks.permissions.createEventDetails = error
          } else {
            checks.permissions.createEvent = 'Can create events ✅'
            checks.permissions.testEventId = data.id

            // Clean up test event
            const { error: deleteError } = await supabase
              .from('events')
              .delete()
              .eq('id', data.id)

            if (deleteError) {
              checks.permissions.cleanup = `Delete failed: ${deleteError.message}`
            } else {
              checks.permissions.cleanup = 'Test event cleaned up ✅'
            }
          }
        }
      } catch (err: any) {
        checks.permissions.createEvent = `Exception: ${err.message}`
      }

      // Check current user
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        if (error) {
          checks.permissions.user = `Error: ${error.message}`
        } else if (user) {
          checks.permissions.user = `Logged in as: ${user.email}`
          checks.permissions.userId = user.id
        } else {
          checks.permissions.user = 'Not logged in'
        }
      } catch (err: any) {
        checks.permissions.user = `Exception: ${err.message}`
      }

    } catch (error: any) {
      checks.error = error.message
    }

    setResults(checks)
    setIsChecking(false)
  }

  const runMigrations = async () => {
    try {
      toast.info('Running database migrations...')

      // Try to create the events table if it doesn't exist
      const createEventsTable = `
        CREATE TABLE IF NOT EXISTS events (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          title TEXT NOT NULL,
          date_time TIMESTAMP WITH TIME ZONE NOT NULL,
          location TEXT NOT NULL,
          notes TEXT,
          drink_type TEXT,
          vibe TEXT,
          created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `

      const createRsvpsTable = `
        CREATE TABLE IF NOT EXISTS rsvps (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          event_id UUID REFERENCES events(id) ON DELETE CASCADE,
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          status TEXT NOT NULL DEFAULT 'maybe',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(event_id, user_id)
        );
      `

      // Note: These would need to be run via Supabase SQL editor or CLI
      // For now, just show the user what needs to be done

      toast.error('Migrations need to be run via Supabase dashboard or CLI')
      console.log('Run these in Supabase SQL editor:')
      console.log(createEventsTable)
      console.log(createRsvpsTable)

    } catch (error: any) {
      toast.error(`Migration failed: ${error.message}`)
    }
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">Database Checker</h1>

        <div className="flex gap-4">
          <Button onClick={checkDatabase} disabled={isChecking}>
            {isChecking ? 'Checking...' : 'Check Database'}
          </Button>
          <Button onClick={runMigrations} variant="outline">
            Show Migration SQL
          </Button>
        </div>

        {results && (
          <div className="bg-card p-4 rounded-lg border">
            <h2 className="text-lg font-semibold mb-4">Database Status</h2>
            <pre className="bg-muted p-4 rounded text-sm overflow-auto">
              {JSON.stringify(results, null, 2)}
            </pre>
          </div>
        )}

        <div className="bg-card p-4 rounded-lg border">
          <h2 className="text-lg font-semibold mb-4">Quick Fixes</h2>
          <div className="space-y-2 text-sm">
            <p><strong>If tables don't exist:</strong></p>
            <ol className="list-decimal list-inside space-y-1 ml-4">
              <li>Go to your Supabase dashboard</li>
              <li>Navigate to SQL Editor</li>
              <li>Run the migration files in the supabase/migrations folder</li>
              <li>Or click "Show Migration SQL" above and copy/paste</li>
            </ol>

            <p className="mt-4"><strong>If permission errors:</strong></p>
            <ol className="list-decimal list-inside space-y-1 ml-4">
              <li>Check Row Level Security (RLS) policies</li>
              <li>Make sure you're logged in</li>
              <li>Verify user has correct permissions</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}
