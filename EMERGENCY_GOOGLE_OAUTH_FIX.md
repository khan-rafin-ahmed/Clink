# 🚨 EMERGENCY GOOGLE OAUTH FIX

## Current Status: CRITICAL
You're still getting "Database error saving new user" which means the database trigger approach isn't working. We need to disable the trigger completely and rely on application-level profile creation.

## 🔧 IMMEDIATE ACTION REQUIRED

### Step 1: Run Emergency Database Fix (URGENT)

**Copy and paste this ENTIRE script into your Supabase SQL Editor and run it:**

```sql
-- EMERGENCY FIX: Disable trigger and rely on application-level profile creation
-- This completely bypasses the problematic database trigger
-- Run this in your Supabase SQL Editor IMMEDIATELY

-- Step 1: DISABLE the problematic trigger completely
DROP TRIGGER IF EXISTS create_user_profile_trigger ON auth.users;

-- Step 2: Keep the manual profile creation function (this works)
CREATE OR REPLACE FUNCTION create_profile_for_user(target_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_record RECORD;
    display_name_value TEXT;
    profile_exists BOOLEAN := FALSE;
BEGIN
    -- Get user data from auth.users
    SELECT * FROM auth.users WHERE id = target_user_id INTO user_record;
    
    IF NOT FOUND THEN
        RAISE NOTICE 'User not found: %', target_user_id;
        RETURN FALSE;
    END IF;

    -- Check if profile already exists
    SELECT EXISTS(
        SELECT 1 FROM public.user_profiles WHERE user_id = target_user_id
    ) INTO profile_exists;

    IF profile_exists THEN
        RAISE NOTICE 'Profile already exists for user %', target_user_id;
        RETURN TRUE;
    END IF;

    -- Extract display name
    display_name_value := COALESCE(
        user_record.raw_user_meta_data->>'full_name',
        user_record.raw_user_meta_data->>'name',
        user_record.user_metadata->>'full_name',
        user_record.user_metadata->>'name',
        split_part(user_record.email, '@', 1),
        'User'
    );

    -- Create profile
    BEGIN
        INSERT INTO public.user_profiles (user_id, display_name, created_at, updated_at)
        VALUES (target_user_id, display_name_value, NOW(), NOW());
        
        RAISE NOTICE 'Profile created manually for user: %', target_user_id;
        RETURN TRUE;
        
    EXCEPTION 
        WHEN unique_violation THEN
            RAISE NOTICE 'Profile already exists (created by another process)';
            RETURN TRUE;
            
        WHEN OTHERS THEN
            RAISE WARNING 'Error creating profile manually: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
            RETURN FALSE;
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Grant permissions for the manual function
GRANT EXECUTE ON FUNCTION create_profile_for_user(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION create_profile_for_user(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION create_profile_for_user(UUID) TO anon;

-- Step 4: Ensure RLS policies allow profile creation
-- Create or update RLS policy to allow authenticated users to insert their own profiles
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.user_profiles;
CREATE POLICY "Users can insert their own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Ensure users can read their own profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
CREATE POLICY "Users can view their own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = user_id);

-- Ensure users can update their own profiles
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
CREATE POLICY "Users can update their own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- Allow public read access for profiles (needed for app functionality)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.user_profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.user_profiles
    FOR SELECT USING (true);

-- Step 5: Fix any existing users without profiles
DO $$
DECLARE
    user_record RECORD;
    display_name_value TEXT;
    fixed_count INTEGER := 0;
BEGIN
    FOR user_record IN 
        SELECT u.* FROM auth.users u
        LEFT JOIN public.user_profiles p ON u.id = p.user_id
        WHERE p.user_id IS NULL
    LOOP
        -- Extract display name
        display_name_value := COALESCE(
            user_record.raw_user_meta_data->>'full_name',
            user_record.raw_user_meta_data->>'name',
            user_record.user_metadata->>'full_name',
            user_record.user_metadata->>'name',
            split_part(user_record.email, '@', 1),
            'User'
        );

        -- Create missing profile
        BEGIN
            INSERT INTO public.user_profiles (user_id, display_name, created_at, updated_at)
            VALUES (user_record.id, display_name_value, NOW(), NOW());
            
            fixed_count := fixed_count + 1;
            RAISE NOTICE 'Fixed missing profile for user: % (email: %)', user_record.id, user_record.email;
            
        EXCEPTION 
            WHEN unique_violation THEN
                -- Profile exists now, skip
                CONTINUE;
            WHEN OTHERS THEN
                RAISE WARNING 'Could not fix profile for user %: %', user_record.id, SQLERRM;
        END;
    END LOOP;
    
    RAISE NOTICE 'Fixed % missing user profiles', fixed_count;
END $$;

-- Step 6: Verify the fix
SELECT 
    'Trigger Status' as check_type,
    CASE 
        WHEN EXISTS(
            SELECT 1 FROM information_schema.triggers 
            WHERE trigger_name = 'create_user_profile_trigger'
        ) THEN 'STILL ACTIVE (BAD)'
        ELSE 'DISABLED (GOOD)'
    END as status

UNION ALL

SELECT 
    'Users without profiles' as check_type,
    COUNT(*)::text as status
FROM auth.users u
LEFT JOIN public.user_profiles p ON u.id = p.user_id
WHERE p.user_id IS NULL

UNION ALL

SELECT 
    'Manual function available' as check_type,
    CASE 
        WHEN EXISTS(
            SELECT 1 FROM information_schema.routines 
            WHERE routine_name = 'create_profile_for_user'
        ) THEN 'YES (GOOD)'
        ELSE 'NO (BAD)'
    END as status;

-- Success message
SELECT 'EMERGENCY FIX APPLIED: Trigger disabled, application will handle profile creation' as status;
```

### Step 2: Deploy Updated Code

The code changes I made will now handle profile creation at the application level instead of relying on the database trigger.

### Step 3: Test Immediately

1. **Clear your browser cache completely**
2. **Open an incognito/private window**
3. **Go to https://www.thirstee.app**
4. **Try Google OAuth signup with a fresh Google account**

## 🎯 What This Emergency Fix Does

1. **DISABLES the problematic database trigger** completely
2. **Creates a reliable manual profile creation function**
3. **Updates RLS policies** to allow application-level profile creation
4. **Fixes any existing users** without profiles
5. **Enhanced application code** handles profile creation with multiple retry attempts

## 📊 Expected Results After Fix

- ✅ **No more "Database error saving new user"**
- ✅ **Google OAuth signup works for new users**
- ✅ **Existing users continue to work normally**
- ✅ **Magic link signup continues to work**
- ✅ **Application handles all profile creation**

## 🔍 Verification Steps

After running the emergency fix, you should see:

1. **Trigger Status: DISABLED (GOOD)**
2. **Users without profiles: 0**
3. **Manual function available: YES (GOOD)**

## 🚨 If It Still Doesn't Work

If you're still seeing the error after this fix:

1. **Check Supabase Auth Settings**:
   - Go to Supabase Dashboard → Authentication → Settings
   - Ensure "Enable email confirmations" is OFF for testing
   - Check that Google OAuth is properly configured

2. **Check Google OAuth Configuration**:
   - Verify Client ID and Secret are correct
   - Ensure redirect URLs include your domain
   - Check that the OAuth consent screen is configured

3. **Clear All Browser Data**:
   - Clear cookies, cache, and local storage
   - Try in a completely fresh incognito window

## 📞 Emergency Support

If the issue persists after this fix, the problem might be:

1. **Supabase Auth Configuration** - Check your auth settings
2. **Google OAuth Setup** - Verify your Google Cloud Console settings
3. **RLS Policies** - May need additional policy adjustments

The emergency fix removes the database trigger entirely and relies on the application to create profiles, which is more reliable and easier to debug.

## ⚡ Quick Test Command

After applying the fix, you can test the manual profile creation function:

```sql
-- Test the manual function (replace with a real user ID)
SELECT create_profile_for_user('your-user-id-here');
```

This emergency approach should resolve the Google OAuth issue immediately.
