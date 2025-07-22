-- CREATE HELPER FUNCTIONS FOR FRONTEND EMAIL SERVICE
-- These functions provide safe access to user data without exposing auth.users directly
-- Date: 2025-01-22

-- Drop existing function if it exists with different return type
DROP FUNCTION IF EXISTS get_user_email(uuid);

-- Function to get user email safely
CREATE OR REPLACE FUNCTION get_user_email(user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_email TEXT;
BEGIN
    -- Get user email from auth.users (using SECURITY DEFINER to bypass RLS)
    SELECT email INTO user_email
    FROM auth.users
    WHERE id = user_id;
    
    RETURN user_email;
END;
$$;

-- Drop existing function if it exists with different return type
DROP FUNCTION IF EXISTS get_invitation_tokens(integer);

-- Function to get invitation tokens safely
CREATE OR REPLACE FUNCTION get_invitation_tokens(invitation_id INTEGER)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    accept_token TEXT;
    decline_token TEXT;
BEGIN
    -- Get accept token
    SELECT token INTO accept_token
    FROM invitation_tokens
    WHERE invitation_tokens.invitation_id = get_invitation_tokens.invitation_id::text
      AND action = 'accept'
      AND expires_at > NOW()
      AND used = false
    LIMIT 1;
    
    -- Get decline token
    SELECT token INTO decline_token
    FROM invitation_tokens
    WHERE invitation_tokens.invitation_id = get_invitation_tokens.invitation_id::text
      AND action = 'decline'
      AND expires_at > NOW()
      AND used = false
    LIMIT 1;
    
    -- Return as JSON
    RETURN json_build_object(
        'accept_token', accept_token,
        'decline_token', decline_token
    );
END;
$$;

-- Grant permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_user_email TO authenticated;
GRANT EXECUTE ON FUNCTION get_invitation_tokens TO authenticated;

-- Add comments
COMMENT ON FUNCTION get_user_email IS 'Safely retrieves user email from auth.users for frontend email service';
COMMENT ON FUNCTION get_invitation_tokens IS 'Safely retrieves invitation tokens for email Accept/Decline buttons';

-- Success message
SELECT 'Helper functions created for frontend email service!' as status;
