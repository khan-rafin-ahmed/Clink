import { supabase } from './supabase'

export async function addFavoriteDrinkColumn() {
  try {
    console.log('🔄 Attempting to add favorite_drink column...')

    // First, check if the column already exists by trying to select it
    const { error: testError } = await supabase
      .from('user_profiles')
      .select('favorite_drink')
      .limit(1)

    if (!testError) {
      console.log('✅ favorite_drink column already exists!')
      return { success: true, message: 'Column already exists' }
    }

    console.log('Column does not exist, attempting to add it...')

    // Try to add the column using a direct SQL query
    // Note: This requires the user to have appropriate permissions
    const { error } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE user_profiles ADD COLUMN favorite_drink TEXT;'
    })

    if (error) {
      console.error('❌ Failed to add column via RPC:', error)

      // If RPC fails, provide instructions for manual addition
      return {
        success: false,
        message: 'Could not add column automatically. Please add it manually in Supabase dashboard.',
        instructions: [
          '1. Go to your Supabase dashboard',
          '2. Navigate to Table Editor → user_profiles',
          '3. Click "Add Column"',
          '4. Name: favorite_drink, Type: text, Nullable: true',
          '5. Save the column'
        ]
      }
    }

    console.log('✅ favorite_drink column added successfully!')
    return { success: true, message: 'Column added successfully' }

  } catch (error: any) {
    console.error('❌ Error adding favorite_drink column:', error)
    return {
      success: false,
      message: `Error: ${error.message}`,
      instructions: [
        'Manual steps to add the column:',
        '1. Go to your Supabase dashboard',
        '2. Navigate to Table Editor → user_profiles',
        '3. Click "Add Column"',
        '4. Name: favorite_drink, Type: text, Nullable: true',
        '5. Save the column'
      ]
    }
  }
}

export async function checkFavoriteDrinkColumn() {
  try {
    const { error } = await supabase
      .from('user_profiles')
      .select('favorite_drink')
      .limit(1)

    return {
      exists: !error,
      error: error?.message || null
    }
  } catch (error: any) {
    return {
      exists: false,
      error: error.message
    }
  }
}
