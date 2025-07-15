import { supabase } from './supabase'

/**
 * Debug utilities for testing notification system
 */

export interface DebugTestResult {
  success: boolean
  message: string
  data?: any
  error?: string
}

/**
 * Create a test user for debugging purposes
 */
export async function createTestUser(email: string, displayName?: string): Promise<DebugTestResult> {
  try {
    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('user_profiles')
      .select('user_id')
      .eq('email', email)
      .single()

    if (existingUser) {
      return {
        success: true,
        message: 'Test user already exists',
        data: { user_id: existingUser.user_id }
      }
    }

    // Create auth user
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: 'temp-debug-password-123',
      email_confirm: true
    })

    if (authError) throw authError

    // Create user profile
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        user_id: authUser.user.id,
        email,
        display_name: displayName || 'Debug Test User',
        username: email.split('@')[0] + '_debug'
      })

    if (profileError) throw profileError

    return {
      success: true,
      message: 'Test user created successfully',
      data: { user_id: authUser.user.id }
    }

  } catch (error: any) {
    return {
      success: false,
      message: 'Failed to create test user',
      error: error.message
    }
  }
}

/**
 * Clean up test data
 */
export async function cleanupTestData(eventId?: string): Promise<DebugTestResult> {
  try {
    const cleanupTasks = []

    if (eventId) {
      // Delete event members
      cleanupTasks.push(
        supabase.from('event_members').delete().eq('event_id', eventId)
      )

      // Delete invitation tokens for this event
      cleanupTasks.push(
        supabase.from('invitation_tokens').delete().contains('invitation_id', eventId)
      )

      // Delete notifications for this event
      cleanupTasks.push(
        supabase.from('notifications').delete().contains('data', { event_id: eventId })
      )

      // Delete the event
      cleanupTasks.push(
        supabase.from('events').delete().eq('id', eventId)
      )
    }

    // Clean up old debug tokens (older than 1 hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    cleanupTasks.push(
      supabase
        .from('invitation_tokens')
        .delete()
        .lt('created_at', oneHourAgo)
        .ilike('token', '%debug%')
    )

    await Promise.all(cleanupTasks)

    return {
      success: true,
      message: 'Test data cleaned up successfully'
    }

  } catch (error: any) {
    return {
      success: false,
      message: 'Failed to clean up test data',
      error: error.message
    }
  }
}

/**
 * Validate database functions exist and are working
 */
export async function validateDatabaseFunctions(): Promise<DebugTestResult> {
  try {
    const validationResults = []

    // Test respond_to_event_invitation function
    try {
      await supabase.rpc('respond_to_event_invitation', {
        p_invitation_id: '00000000-0000-0000-0000-000000000000',
        p_user_id: '00000000-0000-0000-0000-000000000000',
        p_response: 'accepted',
        p_comment: null
      })
    } catch (error: any) {
      if (error.message.includes('Invitation not found')) {
        validationResults.push({ function: 'respond_to_event_invitation', status: 'exists' })
      } else {
        validationResults.push({ function: 'respond_to_event_invitation', status: 'error', error: error.message })
      }
    }

    // Test process_event_invitation_token function
    try {
      await supabase.rpc('process_event_invitation_token', {
        p_token: 'test_token_that_does_not_exist',
        p_user_id: null
      })
    } catch (error: any) {
      if (error.message.includes('Invalid or expired')) {
        validationResults.push({ function: 'process_event_invitation_token', status: 'exists' })
      } else {
        validationResults.push({ function: 'process_event_invitation_token', status: 'error', error: error.message })
      }
    }

    // Test send_event_invitation_emails_with_tokens function
    try {
      await supabase.rpc('send_event_invitation_emails_with_tokens', {
        p_event_id: '00000000-0000-0000-0000-000000000000',
        p_inviter_id: '00000000-0000-0000-0000-000000000000'
      })
    } catch (error: any) {
      if (error.message.includes('Event not found')) {
        validationResults.push({ function: 'send_event_invitation_emails_with_tokens', status: 'exists' })
      } else {
        validationResults.push({ function: 'send_event_invitation_emails_with_tokens', status: 'error', error: error.message })
      }
    }

    const hasErrors = validationResults.some(r => r.status === 'error')

    return {
      success: !hasErrors,
      message: hasErrors ? 'Some database functions have issues' : 'All database functions are working',
      data: validationResults
    }

  } catch (error: any) {
    return {
      success: false,
      message: 'Failed to validate database functions',
      error: error.message
    }
  }
}

/**
 * Get comprehensive system status
 */
export async function getSystemStatus(): Promise<DebugTestResult> {
  try {
    const status = {
      database: 'unknown',
      functions: 'unknown',
      tables: 'unknown'
    }

    // Test database connection
    try {
      const { error } = await supabase.from('events').select('count').limit(1)
      status.database = error ? 'error' : 'connected'
    } catch {
      status.database = 'error'
    }

    // Test functions
    const functionValidation = await validateDatabaseFunctions()
    status.functions = functionValidation.success ? 'working' : 'error'

    // Test required tables
    try {
      const tableChecks = await Promise.all([
        supabase.from('invitation_tokens').select('count').limit(1),
        supabase.from('event_members').select('count').limit(1),
        supabase.from('notifications').select('count').limit(1),
        supabase.from('events').select('count').limit(1),
        supabase.from('user_profiles').select('count').limit(1)
      ])

      const hasTableErrors = tableChecks.some(check => check.error)
      status.tables = hasTableErrors ? 'error' : 'accessible'
    } catch {
      status.tables = 'error'
    }

    const overallStatus = Object.values(status).every(s => s === 'connected' || s === 'working' || s === 'accessible')

    return {
      success: overallStatus,
      message: overallStatus ? 'System is healthy' : 'System has issues',
      data: status
    }

  } catch (error: any) {
    return {
      success: false,
      message: 'Failed to get system status',
      error: error.message
    }
  }
}

/**
 * Format debug data for display
 */
export function formatDebugData(data: any): string {
  if (typeof data === 'string') return data
  if (data === null || data === undefined) return 'null'
  
  try {
    return JSON.stringify(data, null, 2)
  } catch {
    return String(data)
  }
}

/**
 * Generate a debug-friendly timestamp
 */
export function getDebugTimestamp(): string {
  return new Date().toISOString().replace('T', ' ').slice(0, 19)
}
