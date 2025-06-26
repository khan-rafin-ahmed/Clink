import { supabase } from './supabase'

// Apply the crew members DELETE policy migration
export async function applyCrewDeletePolicy() {
  const sql = `
    -- Add DELETE policy for crew_members table
    -- This allows crew creators to remove pending invitations and members

    -- Drop existing DELETE policy if it exists
    DROP POLICY IF EXISTS "Crew creators can remove members" ON crew_members;
    DROP POLICY IF EXISTS "Users can leave crews" ON crew_members;

    -- Create DELETE policy that allows:
    -- 1. Crew creators to remove any member (including pending invitations)
    -- 2. Users to remove themselves (leave crew)
    CREATE POLICY "Crew creators can remove members and users can leave" ON crew_members
    FOR DELETE USING (
      -- Crew creator can remove any member from their crew
      EXISTS (
        SELECT 1 FROM crews
        WHERE id = crew_members.crew_id
        AND created_by = auth.uid()
      )
      OR
      -- Users can remove themselves (leave crew)
      user_id = auth.uid()
    );
  `

  try {
    const { error } = await supabase.rpc('exec_sql', { sql })
    if (error) {
      console.error('Error applying crew delete policy:', error)
      throw error
    }
    console.log('✅ Crew delete policy applied successfully')
    return true
  } catch (error) {
    console.error('Failed to apply crew delete policy:', error)
    throw error
  }
}
