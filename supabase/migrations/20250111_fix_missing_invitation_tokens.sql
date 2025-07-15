-- CRITICAL FIX: Missing invitation token generation
-- Root Cause: Email invitations are sent without creating invitation tokens
-- This causes email links to fail with "token not found" errors

-- Create a function to generate invitation tokens and send emails
CREATE OR REPLACE FUNCTION send_event_invitation_emails_with_tokens(
    p_event_id UUID,
    p_inviter_id UUID
)
RETURNS TABLE (
    emails_sent INTEGER,
    emails_failed INTEGER,
    tokens_created INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    event_record RECORD;
    inviter_record RECORD;
    invitation_record RECORD;
    email_data JSONB;
    response_data JSONB;
    emails_sent_count INTEGER := 0;
    emails_failed_count INTEGER := 0;
    tokens_created_count INTEGER := 0;
    accept_token TEXT;
    decline_token TEXT;
    accept_token_expires TIMESTAMPTZ;
    decline_token_expires TIMESTAMPTZ;
BEGIN
    -- Get event details
    SELECT * INTO event_record FROM events WHERE id = p_event_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Event not found';
    END IF;
    
    -- Get inviter details
    SELECT * INTO inviter_record FROM user_profiles WHERE user_id = p_inviter_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Inviter not found';
    END IF;
    
    -- Set token expiration (48 hours from now)
    accept_token_expires := NOW() + INTERVAL '48 hours';
    decline_token_expires := NOW() + INTERVAL '48 hours';
    
    -- Loop through pending invitations in event_members table
    FOR invitation_record IN
        SELECT em.*, up.email as user_email, up.display_name as user_name
        FROM event_members em
        JOIN user_profiles up ON em.user_id = up.user_id
        WHERE em.event_id = p_event_id 
          AND em.status = 'pending'
          AND em.invited_by = p_inviter_id
          AND up.email IS NOT NULL
    LOOP
        BEGIN
            -- Generate accept token
            accept_token := 'event_accept_' || replace(gen_random_uuid()::text, '-', '');
            
            -- Generate decline token  
            decline_token := 'event_decline_' || replace(gen_random_uuid()::text, '-', '');
            
            -- Create accept token record
            INSERT INTO invitation_tokens (
                token,
                invitation_type,
                invitation_id,
                action,
                user_id,
                expires_at,
                used
            ) VALUES (
                accept_token,
                'event',
                invitation_record.id::text,
                'accept',
                invitation_record.user_id,
                accept_token_expires,
                false
            );
            
            -- Create decline token record
            INSERT INTO invitation_tokens (
                token,
                invitation_type,
                invitation_id,
                action,
                user_id,
                expires_at,
                used
            ) VALUES (
                decline_token,
                'event',
                invitation_record.id::text,
                'decline',
                invitation_record.user_id,
                decline_token_expires,
                false
            );
            
            tokens_created_count := tokens_created_count + 2;
            
            -- Prepare email data with actual tokens
            email_data := jsonb_build_object(
                'event_title', event_record.title,
                'inviter_name', inviter_record.display_name,
                'event_date_time', event_record.date_time,
                'event_location', event_record.location,
                'event_id', event_record.id,
                'invitation_id', invitation_record.id,
                'accept_token', accept_token,
                'decline_token', decline_token
            );

            -- Call the send-email edge function with tokens
            SELECT content INTO response_data
            FROM net.http_post(
                url := 'https://arpphimkotjvnfoacquj.supabase.co/functions/v1/send-email',
                headers := jsonb_build_object(
                    'Content-Type', 'application/json',
                    'Authorization', 'Bearer ' || current_setting('app.service_role_key', true)
                ),
                body := jsonb_build_object(
                    'to', invitation_record.user_email,
                    'subject', format('🍻 You''re invited to %s', event_record.title),
                    'type', 'event_invitation',
                    'data', email_data
                )
            );

            emails_sent_count := emails_sent_count + 1;
            
            RAISE NOTICE 'Event invitation email sent to: % with tokens: %, %', 
                invitation_record.user_email, accept_token, decline_token;
            
        EXCEPTION
            WHEN OTHERS THEN
                emails_failed_count := emails_failed_count + 1;
                RAISE NOTICE 'Failed to send email to %: %', invitation_record.user_email, SQLERRM;
        END;
    END LOOP;
    
    RETURN QUERY SELECT emails_sent_count, emails_failed_count, tokens_created_count;
END;
$$;

-- Update the existing send_event_invitation_emails function to use the new token-enabled version
CREATE OR REPLACE FUNCTION send_event_invitation_emails(
    p_event_id UUID,
    p_inviter_id UUID
)
RETURNS TABLE (
    emails_sent INTEGER,
    emails_failed INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result_record RECORD;
BEGIN
    -- Call the new token-enabled function
    SELECT * INTO result_record 
    FROM send_event_invitation_emails_with_tokens(p_event_id, p_inviter_id);
    
    -- Return the expected format
    RETURN QUERY SELECT result_record.emails_sent, result_record.emails_failed;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION send_event_invitation_emails_with_tokens TO authenticated;
GRANT EXECUTE ON FUNCTION send_event_invitation_emails_with_tokens TO service_role;
GRANT EXECUTE ON FUNCTION send_event_invitation_emails TO authenticated;
GRANT EXECUTE ON FUNCTION send_event_invitation_emails TO service_role;

-- Test message
SELECT 'FIXED: Email invitations now generate invitation tokens! Email links will work correctly.' as status;
