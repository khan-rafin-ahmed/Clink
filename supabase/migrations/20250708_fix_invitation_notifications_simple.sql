-- SIMPLE FIX: Just fix the missing invitation_id issue for existing notifications
-- This is a safer, simpler approach

-- 1. Create a function to fix existing notifications that are missing invitation_id
CREATE OR REPLACE FUNCTION fix_missing_invitation_ids()
RETURNS TABLE(
    notification_id UUID,
    invitation_id UUID,
    status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    notification_record RECORD;
    found_invitation_id UUID;
    fixed_count INTEGER := 0;
BEGIN
    -- Find notifications missing invitation_id
    FOR notification_record IN
        SELECT id, user_id, data, created_at
        FROM notifications
        WHERE type = 'event_invitation'
        AND (data->>'invitation_id' IS NULL OR data->>'invitation_id' = '' OR data->>'invitation_id' = 'null')
        AND created_at > NOW() - INTERVAL '7 days'  -- Only recent ones
        ORDER BY created_at DESC
    LOOP
        -- Try to find the corresponding invitation
        SELECT em.id INTO found_invitation_id
        FROM event_members em
        WHERE em.user_id = notification_record.user_id
        AND em.event_id = (notification_record.data->>'event_id')::UUID
        AND em.status IN ('pending', 'accepted', 'declined')
        AND em.created_at >= notification_record.created_at - INTERVAL '5 minutes'
        AND em.created_at <= notification_record.created_at + INTERVAL '5 minutes'
        ORDER BY ABS(EXTRACT(EPOCH FROM (em.created_at - notification_record.created_at)))
        LIMIT 1;
        
        -- If found, update the notification
        IF found_invitation_id IS NOT NULL THEN
            UPDATE notifications
            SET data = data || jsonb_build_object('invitation_id', found_invitation_id::text)
            WHERE id = notification_record.id;
            
            -- Return the result
            RETURN QUERY SELECT 
                notification_record.id,
                found_invitation_id,
                'fixed'::TEXT;
            
            fixed_count := fixed_count + 1;
        ELSE
            -- Return the unfixed ones
            RETURN QUERY SELECT 
                notification_record.id,
                NULL::UUID,
                'not_found'::TEXT;
        END IF;
    END LOOP;
    
    -- If no records to process
    IF fixed_count = 0 AND NOT FOUND THEN
        RETURN QUERY SELECT 
            NULL::UUID,
            NULL::UUID,
            'no_notifications_to_fix'::TEXT;
    END IF;
END;
$$;

-- 2. Run the fix and show results
SELECT 
    'Fixing missing invitation_ids...' as action,
    COUNT(*) as total_processed,
    COUNT(*) FILTER (WHERE status = 'fixed') as fixed_count,
    COUNT(*) FILTER (WHERE status = 'not_found') as not_found_count
FROM fix_missing_invitation_ids();

-- 3. Show the results in detail
SELECT 
    notification_id,
    invitation_id,
    status,
    CASE 
        WHEN status = 'fixed' THEN '✅ Fixed'
        WHEN status = 'not_found' THEN '❌ Could not find matching invitation'
        ELSE '⚠️ ' || status
    END as result
FROM fix_missing_invitation_ids()
ORDER BY status DESC;

-- 4. Verify the fix worked
SELECT 
    'After fix - notifications with invitation_id:' as info,
    COUNT(*) as count
FROM notifications 
WHERE type = 'event_invitation'
AND data->>'invitation_id' IS NOT NULL 
AND data->>'invitation_id' != ''
AND data->>'invitation_id' != 'null'
AND created_at > NOW() - INTERVAL '7 days';

-- 5. Show remaining notifications without invitation_id
SELECT 
    'Remaining notifications without invitation_id:' as info,
    COUNT(*) as count
FROM notifications 
WHERE type = 'event_invitation'
AND (data->>'invitation_id' IS NULL OR data->>'invitation_id' = '' OR data->>'invitation_id' = 'null')
AND created_at > NOW() - INTERVAL '7 days';

-- 6. Clean up the function
DROP FUNCTION IF EXISTS fix_missing_invitation_ids;

SELECT 'Missing invitation_id fix completed!' as status;
