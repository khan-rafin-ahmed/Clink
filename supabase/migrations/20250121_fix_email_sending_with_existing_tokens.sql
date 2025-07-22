-- FIX EMAIL SENDING: Use existing tokens created by trigger
-- Updates the send_event_invitation_emails function to use tokens created by the trigger
-- instead of generating new ones
-- Date: 2025-01-21

-- Drop existing function to avoid return type conflicts
DROP FUNCTION IF EXISTS send_event_invitation_emails(uuid, uuid);

-- Create the updated send_event_invitation_emails function to use existing tokens
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
    email_data JSONB;
    response_data JSONB;
    emails_sent_count INTEGER := 0;
    emails_failed_count INTEGER := 0;
    supabase_url TEXT := 'https://arpphimkotjvnfoacquj.supabase.co';
    service_role_key TEXT := current_setting('app.service_role_key', true);
BEGIN
    -- Get event details
    SELECT * INTO event_record
    FROM events
    WHERE id = p_event_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Event not found';
    END IF;

    -- Get inviter details
    SELECT display_name INTO inviter_record
    FROM user_profiles
    WHERE user_id = p_inviter_id;

    -- Loop through pending invitations
    FOR invitation_record IN
        SELECT em.id, em.user_id, up.email as user_email
        FROM event_members em
        LEFT JOIN user_profiles up ON em.user_id = up.user_id
        WHERE em.event_id = p_event_id
          AND em.status = 'pending'
          AND em.invited_by = p_inviter_id
    LOOP
        BEGIN
            -- Get user email (try user_profiles first, then auth.users)
            user_email := invitation_record.user_email;

            IF user_email IS NULL THEN
                SELECT email INTO user_email
                FROM auth.users
                WHERE id = invitation_record.user_id;
            END IF;

            -- Skip if no email found
            IF user_email IS NULL THEN
                emails_failed_count := emails_failed_count + 1;
                RAISE NOTICE 'No email found for user %, skipping', invitation_record.user_id;
                CONTINUE;
            END IF;

            -- Get existing tokens created by the trigger
            SELECT
                MAX(CASE WHEN action = 'accept' THEN token END) as accept_token,
                MAX(CASE WHEN action = 'decline' THEN token END) as decline_token
            INTO accept_token, decline_token
            FROM invitation_tokens
            WHERE invitation_id = invitation_record.id
              AND invitation_type = 'event'
              AND user_id = invitation_record.user_id
              AND used = false
              AND expires_at > NOW();

            -- Prepare email data with tokens
            email_data := jsonb_build_object(
                'event_title', event_record.title,
                'inviter_name', COALESCE(inviter_record.display_name, 'Someone'),
                'event_date_time', event_record.date_time,
                'event_location', event_record.location,
                'event_id', event_record.id,
                'invitation_id', invitation_record.id,
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

            RAISE NOTICE 'Event invitation email sent to: % with tokens: %, %',
                user_email, accept_token, decline_token;

        EXCEPTION
            WHEN OTHERS THEN
                emails_failed_count := emails_failed_count + 1;
                RAISE NOTICE 'Failed to send email to %: %', user_email, SQLERRM;
        END;
    END LOOP;

    RETURN QUERY SELECT emails_sent_count, emails_failed_count;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION send_event_invitation_emails TO authenticated;
GRANT EXECUTE ON FUNCTION send_event_invitation_emails TO service_role;

-- Add comment
COMMENT ON FUNCTION send_event_invitation_emails IS 'FIXED: Uses existing tokens created by trigger instead of generating new ones. Sends emails with proper Accept/Decline buttons.';

-- Success message
SELECT 'Email sending function updated to use existing tokens created by trigger!' as status;