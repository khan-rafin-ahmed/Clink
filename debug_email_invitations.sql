-- DEBUG SCRIPT: Email invitation processing
-- Run this in Supabase SQL Editor to debug email invitation issues
-- Date: 2025-01-21

-- Step 1: Check if the function exists and its current version
SELECT 
    'Function Status' as check_type,
    proname as function_name,
    prosrc as function_body_preview
FROM pg_proc 
WHERE proname = 'process_event_invitation_token'
LIMIT 1;

-- Step 2: Check recent invitation tokens
SELECT 
    'Recent Tokens' as check_type,
    token,
    invitation_type,
    action,
    user_id,
    expires_at,
    used,
    created_at,
    CASE 
        WHEN expires_at < NOW() THEN 'EXPIRED'
        WHEN used = true THEN 'USED'
        ELSE 'VALID'
    END as token_status
FROM invitation_tokens 
WHERE invitation_type = 'event'
ORDER BY created_at DESC 
LIMIT 10;

-- Step 3: Check recent event invitations
SELECT 
    'Recent Event Invitations' as check_type,
    em.id as invitation_id,
    em.event_id,
    em.user_id,
    em.invited_by,
    em.status,
    em.created_at,
    e.title as event_title,
    up.display_name as invitee_name,
    up2.display_name as inviter_name
FROM event_members em
JOIN events e ON em.event_id = e.id
LEFT JOIN user_profiles up ON em.user_id = up.user_id
LEFT JOIN user_profiles up2 ON em.invited_by = up2.user_id
WHERE em.created_at > NOW() - INTERVAL '7 days'
ORDER BY em.created_at DESC
LIMIT 10;

-- Step 4: Check for constraint violations
SELECT 
    'Constraint Check' as check_type,
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'event_members'::regclass
AND contype = 'c';

-- Step 5: Test token processing with a sample (if any valid tokens exist)
DO $$
DECLARE
    test_token TEXT;
    test_user_id UUID;
    result JSON;
BEGIN
    -- Get a valid test token
    SELECT token, user_id INTO test_token, test_user_id
    FROM invitation_tokens 
    WHERE invitation_type = 'event' 
      AND used = false 
      AND expires_at > NOW()
    LIMIT 1;
    
    IF test_token IS NOT NULL THEN
        RAISE NOTICE 'Testing token: % for user: %', test_token, test_user_id;
        
        -- Test the function
        SELECT process_event_invitation_token(test_token, test_user_id) INTO result;
        
        RAISE NOTICE 'Test result: %', result;
    ELSE
        RAISE NOTICE 'No valid tokens found for testing';
    END IF;
END $$;

-- Step 6: Check notification constraints
SELECT 
    'Notification Constraints' as check_type,
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'notifications'::regclass
AND contype = 'c';

-- Step 7: Check user_profiles table structure
SELECT 
    'User Profiles Structure' as check_type,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
ORDER BY ordinal_position;

-- Step 8: Check for any recent errors in logs (if available)
SELECT 
    'Recent Function Calls' as check_type,
    'Check Supabase logs for process_event_invitation_token errors' as message;

-- Step 9: Verify RLS policies
SELECT 
    'RLS Policies' as check_type,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('event_members', 'invitation_tokens', 'notifications')
ORDER BY tablename, policyname;
