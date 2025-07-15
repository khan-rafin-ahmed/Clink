import { supabase } from './supabase'
import { v4 as uuidv4 } from 'uuid'

/**
 * Invitation Token Service
 * Handles secure, time-limited tokens for email invitation actions
 */

export interface InvitationToken {
  id: string
  token: string
  invitation_type: 'event' | 'crew'
  invitation_id: string
  action: 'accept' | 'decline'
  user_id: string
  expires_at: string
  used: boolean
  created_at: string
}

export interface TokenValidationResult {
  valid: boolean
  token?: InvitationToken
  error?: string
}

/**
 * Generate a secure invitation token
 */
export async function generateInvitationToken(
  invitationType: 'event' | 'crew',
  invitationId: string,
  action: 'accept' | 'decline',
  userId: string,
  expiresInHours: number = 48
): Promise<string> {
  try {
    // Generate a secure random token
    const token = `${invitationType}_${action}_${uuidv4().replace(/-/g, '')}`

    // Calculate expiration time
    const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000).toISOString()

    // Store token in database
    const { error } = await supabase
      .from('invitation_tokens')
      .insert({
        token,
        invitation_type: invitationType,
        invitation_id: invitationId,
        action,
        user_id: userId,
        expires_at: expiresAt,
        used: false
      })

    if (error) {
      throw error
    }

    return token
  } catch (error: any) {
    throw new Error(`Failed to generate secure invitation token: ${error.message}`)
  }
}

/**
 * Validate and retrieve invitation token
 */
export async function validateInvitationToken(token: string): Promise<TokenValidationResult> {
  try {
    const { data: tokenData, error } = await supabase
      .from('invitation_tokens')
      .select('*')
      .eq('token', token)
      .eq('used', false)
      .single()

    if (error || !tokenData) {
      return {
        valid: false,
        error: 'Invalid or expired invitation link'
      }
    }

    // Check if token has expired
    const now = new Date()
    const expiresAt = new Date(tokenData.expires_at)

    if (now > expiresAt) {
      return {
        valid: false,
        error: 'This invitation link has expired'
      }
    }

    return {
      valid: true,
      token: tokenData
    }
  } catch (error: any) {
    return {
      valid: false,
      error: 'Failed to validate invitation link'
    }
  }
}

/**
 * Mark token as used
 */
export async function markTokenAsUsed(token: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('invitation_tokens')
      .update({
        used: true,
        updated_at: new Date().toISOString()
      })
      .eq('token', token)

    if (error) {
      throw error
    }
  } catch (error: any) {
    throw error
  }
}

/**
 * Clean up expired tokens (should be run periodically)
 */
export async function cleanupExpiredTokens(): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('invitation_tokens')
      .delete({ count: 'exact' })
      .lt('expires_at', new Date().toISOString())

    if (error) {
      throw error
    }

    return count || 0
  } catch (error: any) {
    return 0
  }
}

/**
 * Generate tokenized URLs for email invitations
 */
export async function generateTokenizedUrls(
  invitationType: 'event' | 'crew',
  invitationId: string,
  userId: string
): Promise<{ acceptUrl: string; declineUrl: string }> {
  try {
    // Generate tokens for both accept and decline actions
    const [acceptToken, declineToken] = await Promise.all([
      generateInvitationToken(invitationType, invitationId, 'accept', userId),
      generateInvitationToken(invitationType, invitationId, 'decline', userId)
    ])

    // Use production URL for email links
    const baseUrl = 'https://thirstee.app'

    return {
      acceptUrl: `${baseUrl}/invitation/${invitationType}/accept/${acceptToken}`,
      declineUrl: `${baseUrl}/invitation/${invitationType}/decline/${declineToken}`
    }
  } catch (error: any) {
    throw error
  }
}
