-- Debug and fix crew invitations table issues
-- This migration helps debug the "Invalid invite code" errors

-- First, check if the table exists and show its structure
DO $$
BEGIN
    -- Check if crew_invitations table exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'crew_invitations') THEN
        RAISE NOTICE 'crew_invitations table exists';
        
        -- Show table structure
        RAISE NOTICE 'Table structure:';
        FOR rec IN 
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'crew_invitations'
            ORDER BY ordinal_position
        LOOP
            RAISE NOTICE 'Column: % | Type: % | Nullable: % | Default: %', 
                rec.column_name, rec.data_type, rec.is_nullable, rec.column_default;
        END LOOP;
        
        -- Show existing data count
        EXECUTE 'SELECT COUNT(*) FROM crew_invitations' INTO rec;
        RAISE NOTICE 'Total invitations: %', rec;
        
    ELSE
        RAISE NOTICE 'crew_invitations table does NOT exist - this is the problem!';
        RAISE NOTICE 'You need to run the create_crew_invitations_table.sql migration first';
    END IF;
    
    -- Check if crews table exists and has data
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'crews') THEN
        EXECUTE 'SELECT COUNT(*) FROM crews' INTO rec;
        RAISE NOTICE 'Total crews: %', rec;
    ELSE
        RAISE NOTICE 'crews table does NOT exist';
    END IF;
    
    -- Check if crew_members table exists and has data
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'crew_members') THEN
        EXECUTE 'SELECT COUNT(*) FROM crew_members' INTO rec;
        RAISE NOTICE 'Total crew members: %', rec;
    ELSE
        RAISE NOTICE 'crew_members table does NOT exist';
    END IF;
    
END $$;

-- If crew_invitations table exists, let's create a test invitation for debugging
DO $$
DECLARE
    test_crew_id UUID;
    test_user_id UUID;
    test_invite_code TEXT := 'TEST1234';
BEGIN
    -- Only proceed if crew_invitations table exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'crew_invitations') THEN
        
        -- Get a test crew (first crew in the database)
        SELECT id INTO test_crew_id FROM crews LIMIT 1;
        
        -- Get a test user (first user who created a crew)
        SELECT created_by INTO test_user_id FROM crews LIMIT 1;
        
        IF test_crew_id IS NOT NULL AND test_user_id IS NOT NULL THEN
            -- Delete any existing test invitation
            DELETE FROM crew_invitations WHERE invite_code = test_invite_code;
            
            -- Create a test invitation
            INSERT INTO crew_invitations (
                crew_id,
                invite_code,
                created_by,
                expires_at,
                max_uses,
                current_uses
            ) VALUES (
                test_crew_id,
                test_invite_code,
                test_user_id,
                NOW() + INTERVAL '7 days',
                10,
                0
            );
            
            RAISE NOTICE 'Created test invitation with code: %', test_invite_code;
            RAISE NOTICE 'Test URL: /crew/join/%', test_invite_code;
            
        ELSE
            RAISE NOTICE 'No crews found to create test invitation';
        END IF;
        
    END IF;
END $$;
