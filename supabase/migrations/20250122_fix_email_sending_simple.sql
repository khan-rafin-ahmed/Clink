-- SIMPLE FIX: Update send_event_invitation_emails to actually send emails
-- The current function only logs emails but doesn't send them
-- This fixes it to call the Edge Function for actual email delivery
-- Date: 2025-01-22

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
    event_record RECORD;
    inviter_record RECORD;
    invitation_record RECORD;
    accept_token TEXT;
    decline_token TEXT;
    user_email TEXT;
    user_prefs RECORD;
    email_data JSONB;
    response_data JSONB;
    emails_sent_count INTEGER := 0;
    emails_failed_count INTEGER := 0;
    supabase_url TEXT;
    service_role_key TEXT;
BEGIN
    -- Get Supabase configuration
    supabase_url := current_setting('app.supabase_url', true);
    service_role_key := current_setting('app.service_role_key', true);
    
    -- Fallback to hardcoded URL if not set
    IF supabase_url IS NULL OR supabase_url = '' THEN
        supabase_url := 'https://arpphimkotjvnfoacquj.supabase.co';
    END IF;

    -- Get event details
    SELECT * INTO event_record
    FROM events
    WHERE id = p_event_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Event not found';
    END IF;

    -- Get inviter details
    SELECT display_name, username INTO inviter_record
    FROM user_profiles
    WHERE user_id = p_inviter_id;

    -- Loop through pending invitations
    FOR invitation_record IN
        SELECT em.user_id, em.id as invitation_id
        FROM event_members em
        WHERE em.event_id = p_event_id 
          AND em.status = 'pending'
          AND em.invited_by = p_inviter_id
    LOOP
        BEGIN
            -- Get user email
            SELECT au.email INTO user_email
            FROM auth.users au
            WHERE au.id = invitation_record.user_id;

            -- Get user email preferences
            SELECT * INTO user_prefs
            FROM get_user_email_preferences(invitation_record.user_id);

            -- Skip if no email or user doesn't want event invitations
            IF user_email IS NULL OR user_prefs.event_invitations = false THEN
                emails_failed_count := emails_failed_count + 1;
                CONTINUE;
            END IF;

            -- Get existing tokens for this invitation
            SELECT token INTO accept_token
            FROM invitation_tokens
            WHERE invitation_id = invitation_record.invitation_id::text
              AND action = 'accept'
              AND expires_at > NOW()
              AND used = false
            LIMIT 1;

            SELECT token INTO decline_token
            FROM invitation_tokens
            WHERE invitation_id = invitation_record.invitation_id::text
              AND action = 'decline'
              AND expires_at > NOW()
              AND used = false
            LIMIT 1;

            -- Build email data with tokens
            email_data := jsonb_build_object(
                'inviterName', COALESCE(inviter_record.display_name, inviter_record.username, 'Someone'),
                'eventTitle', event_record.title,
                'eventDate', to_char(event_record.date_time, 'YYYY-MM-DD'),
                'eventTime', to_char(event_record.date_time, 'HH12:MI AM'),
                'eventLocation', event_record.location,
                'eventDescription', event_record.description,
                'acceptUrl', CASE 
                    WHEN accept_token IS NOT NULL THEN 'https://thirstee.app/invitation/event/accept/' || accept_token
                    ELSE 'https://thirstee.app/event/' || event_record.id
                END,
                'declineUrl', CASE 
                    WHEN decline_token IS NOT NULL THEN 'https://thirstee.app/invitation/event/decline/' || decline_token
                    ELSE 'https://thirstee.app/event/' || event_record.id
                END,
                'eventUrl', 'https://thirstee.app/event/' || event_record.id
            );

            -- Call the send-email edge function
            SELECT content INTO response_data
            FROM net.http_post(
                url := supabase_url || '/functions/v1/send-email',
                headers := jsonb_build_object(
                    'Content-Type', 'application/json',
                    'Authorization', 'Bearer ' || service_role_key
                ),
                body := jsonb_build_object(
                    'to', user_email,
                    'subject', format('🍻 You''re invited to %s', event_record.title),
                    'type', 'event_invitation',
                    'data', email_data
                )
            );

            emails_sent_count := emails_sent_count + 1;

        EXCEPTION
            WHEN OTHERS THEN
                emails_failed_count := emails_failed_count + 1;
                RAISE NOTICE 'Failed to send email to %: %', user_email, SQLERRM;
        END;
    END LOOP;

    RETURN QUERY SELECT emails_sent_count, emails_failed_count;
END;
$$;

-- Success message
SELECT 'Email sending function updated to actually send emails!' as status;
