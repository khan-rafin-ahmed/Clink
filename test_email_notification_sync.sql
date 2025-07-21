-- TEST EMAIL-NOTIFICATION SYNCHRONIZATION
-- Run this after applying the migration to verify everything works
-- Date: 2025-01-21

-- Step 1: Verify the enhanced schema
SELECT 'Schema Verification' as test_type;

-- Check if new columns exist
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'invitation_tokens' 
  AND column_name IN ('notification_id', 'response_status', 'used_at')
ORDER BY column_name;

-- Check if indexes were created
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'invitation_tokens' 
  AND indexname LIKE 'idx_invitation_tokens_%';

-- Step 2: Verify functions exist with correct signatures
SELECT 'Function Verification' as test_type;

SELECT 
    routine_name,
    routine_type,
    data_type as return_type
FROM information_schema.routines 
WHERE routine_name IN (
    'send_event_invitations_to_users',
    'send_event_invitations_to_crew',
    'process_event_invitation_token',
    'process_crew_invitation_token'
)
ORDER BY routine_name;

-- Step 3: Test token creation and notification linking (if test data exists)
DO $$
DECLARE
    test_event_id UUID;
    test_user_id UUID;
    test_notification_id UUID;
    test_token TEXT;
    result JSON;
BEGIN
    -- Try to find a test event and user
    SELECT id INTO test_event_id FROM events LIMIT 1;
    SELECT user_id INTO test_user_id FROM user_profiles LIMIT 1;
    
    IF test_event_id IS NOT NULL AND test_user_id IS NOT NULL THEN
        RAISE NOTICE 'Testing with event: % and user: %', test_event_id, test_user_id;
        
        -- Create a test notification
        INSERT INTO notifications (
            user_id,
            type,
            title,
            message,
            data
        ) VALUES (
            test_user_id,
            'event_invitation',
            'Test Invitation',
            'Testing email-notification sync',
            jsonb_build_object('event_id', test_event_id, 'test', true)
        ) RETURNING id INTO test_notification_id;
        
        -- Create a test token with notification link
        test_token := 'test_accept_' || replace(gen_random_uuid()::text, '-', '');
        
        INSERT INTO invitation_tokens (
            token,
            invitation_type,
            invitation_id,
            action,
            user_id,
            expires_at,
            notification_id,
            response_status
        ) VALUES (
            test_token,
            'event',
            gen_random_uuid(),
            'accept',
            test_user_id,
            NOW() + INTERVAL '1 hour',
            test_notification_id,
            'pending'
        );
        
        RAISE NOTICE 'Created test token: % linked to notification: %', test_token, test_notification_id;
        
        -- Test the token processing function
        SELECT process_event_invitation_token(test_token, test_user_id) INTO result;
        
        RAISE NOTICE 'Token processing result: %', result;
        
        -- Check if notification was updated
        IF EXISTS (
            SELECT 1 FROM notifications 
            WHERE id = test_notification_id 
              AND data ? 'user_response'
              AND data->>'user_response' = 'accepted'
        ) THEN
            RAISE NOTICE '✅ SUCCESS: Notification was updated with response!';
        ELSE
            RAISE NOTICE '❌ FAILED: Notification was not updated';
        END IF;
        
        -- Cleanup test data
        DELETE FROM invitation_tokens WHERE token = test_token;
        DELETE FROM notifications WHERE id = test_notification_id;
        
        RAISE NOTICE 'Test data cleaned up';
        
    ELSE
        RAISE NOTICE 'No test data available - skipping functional test';
    END IF;
END $$;

-- Step 4: Check constraint validations
SELECT 'Constraint Verification' as test_type;

-- Test response_status constraint
DO $$
BEGIN
    -- This should work
    INSERT INTO invitation_tokens (
        token, invitation_type, invitation_id, action, user_id, expires_at, response_status
    ) VALUES (
        'test_constraint_valid', 'event', gen_random_uuid(), 'accept', 
        (SELECT user_id FROM user_profiles LIMIT 1), NOW() + INTERVAL '1 hour', 'pending'
    );
    
    DELETE FROM invitation_tokens WHERE token = 'test_constraint_valid';
    RAISE NOTICE '✅ Valid response_status constraint works';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Valid response_status test failed: %', SQLERRM;
END $$;

DO $$
BEGIN
    -- This should fail
    INSERT INTO invitation_tokens (
        token, invitation_type, invitation_id, action, user_id, expires_at, response_status
    ) VALUES (
        'test_constraint_invalid', 'event', gen_random_uuid(), 'accept', 
        (SELECT user_id FROM user_profiles LIMIT 1), NOW() + INTERVAL '1 hour', 'invalid_status'
    );
    
    RAISE NOTICE '❌ Invalid response_status constraint failed to block invalid value';
    
EXCEPTION
    WHEN check_violation THEN
        RAISE NOTICE '✅ Invalid response_status constraint correctly blocked invalid value';
    WHEN OTHERS THEN
        RAISE NOTICE '⚠️ Unexpected error testing invalid response_status: %', SQLERRM;
END $$;

-- Step 5: Summary
SELECT 'Test Summary' as test_type;
SELECT 'Email-notification synchronization system testing complete!' as message;
SELECT 'Check the notices above for test results.' as instruction;
