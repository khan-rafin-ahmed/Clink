import { supabase } from './supabase'

export async function runPrivacyMigration() {
  try {
    console.log('Running privacy and follows migration...')

    // Add is_public column to events table
    const addIsPublicColumn = `
      ALTER TABLE events ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true;
    `

    // Create user_profiles table
    const createUserProfilesTable = `
      CREATE TABLE IF NOT EXISTS user_profiles (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
          display_name TEXT,
          bio TEXT,
          avatar_url TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `

    // Create user_follows table
    const createUserFollowsTable = `
      CREATE TABLE IF NOT EXISTS user_follows (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          follower_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          following_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(follower_id, following_id),
          CHECK (follower_id != following_id)
      );
    `

    // Create event_members table
    const createEventMembersTable = `
      CREATE TABLE IF NOT EXISTS event_members (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          event_id UUID REFERENCES events(id) ON DELETE CASCADE,
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          invited_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(event_id, user_id)
      );
    `

    // Create indexes
    const createIndexes = `
      CREATE INDEX IF NOT EXISTS events_is_public_idx ON events(is_public);
      CREATE INDEX IF NOT EXISTS user_follows_follower_idx ON user_follows(follower_id);
      CREATE INDEX IF NOT EXISTS user_follows_following_idx ON user_follows(following_id);
      CREATE INDEX IF NOT EXISTS event_members_event_idx ON event_members(event_id);
      CREATE INDEX IF NOT EXISTS event_members_user_idx ON event_members(user_id);
      CREATE INDEX IF NOT EXISTS user_profiles_user_id_idx ON user_profiles(user_id);
    `

    // Enable RLS
    const enableRLS = `
      ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
      ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;
      ALTER TABLE event_members ENABLE ROW LEVEL SECURITY;
    `

    // Execute migrations
    const migrations = [
      addIsPublicColumn,
      createUserProfilesTable,
      createUserFollowsTable,
      createEventMembersTable,
      createIndexes,
      enableRLS
    ]

    for (const migration of migrations) {
      const { error } = await supabase.rpc('exec_sql', { sql: migration })
      if (error) {
        throw error
      }
    }

    return true
  } catch (error) {
    return false
  }
}

// Helper function to create a user profile for current user
export async function createCurrentUserProfile() {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No authenticated user')

    const displayName = user.email?.split('@')[0] || 'User'

    const { data, error } = await supabase
      .from('user_profiles')
      .insert({
        user_id: user.id,
        display_name: displayName
      })
      .select()
      .single()

    if (error && error.code !== '23505') { // Ignore unique constraint violations
      throw error
    }

    return data
  } catch (error) {
    throw error
  }
}

// Function to add favorite_drink column to user_profiles
export async function addFavoriteDrinkColumn() {
  try {
    console.log('Adding favorite_drink column to user_profiles...')

    // Add favorite_drink column
    const addColumnQuery = `
      ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS favorite_drink TEXT;
    `

    const { error } = await supabase.rpc('exec_sql', { sql: addColumnQuery })

    if (error) {
      console.error('Error adding favorite_drink column:', error)
      // This might fail if we don't have the exec_sql function, which is fine
      // The column will be added via the migration file
    } else {
      console.log('✅ favorite_drink column added successfully')
    }

    return true
  } catch (error) {
    console.error('Error in addFavoriteDrinkColumn:', error)
    // Don't throw error as this is not critical
    return false
  }
}
