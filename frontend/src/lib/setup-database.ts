import { supabase } from './supabase'

export async function setupDatabase() {
  try {
    // Check if events table exists by trying to select from it
    const { data, error } = await supabase
      .from('events')
      .select('count(*)')
      .limit(1)

    if (error) {
      return {
        success: false,
        error: error.message,
        needsSetup: true
      }
    }

    return {
      success: true,
      data,
      needsSetup: false
    }
  } catch (err: any) {
    return {
      success: false,
      error: err.message,
      needsSetup: true
    }
  }
}

export async function testAuth() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()

    if (error) {
      return {
        success: false,
        error: error.message
      }
    }

    return {
      success: true,
      session,
      user: session?.user || null
    }
  } catch (err: any) {
    return {
      success: false,
      error: err.message
    }
  }
}
