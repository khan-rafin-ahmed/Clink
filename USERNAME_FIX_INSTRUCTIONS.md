# Fix Username NOT NULL Constraint Error

## Problem
The error "Failed to load profile: null value in column 'username' of relation 'user_profiles' violates not-null constraint" occurs because:

1. The `username` column was added to `user_profiles` with a NOT NULL constraint
2. Existing profiles don't have usernames
3. The profile creation/update logic wasn't handling username generation properly

## Solution

### Step 1: Run the Database Fix
1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Copy and paste the entire contents of `fix_username_constraint_complete.sql`
4. Run the script

This will:
- Generate usernames ONLY for profiles that don't have them (NULL or empty)
- **PRESERVE all existing usernames** - won't change anyone's current username
- Update the trigger function to automatically create usernames for new users
- Verify all profiles have valid usernames

### Step 2: Frontend Changes (Already Applied)
The following frontend changes have been made:

1. **EditProfile.tsx**: 
   - Added username validation and formatting
   - Better error handling for username constraints
   - Auto-formatting of username input (lowercase, alphanumeric + underscore only)

2. **userService.ts**:
   - Added `generateUsernameFromDisplayName()` helper function
   - Updated `updateUserProfile()` to generate username if missing
   - Updated `createUserProfile()` to always include username
   - Updated `ensureUserProfileExists()` to generate proper usernames

### Step 3: Test the Fix
1. Try to access the Edit Profile page again
2. The error should be resolved
3. All existing users should now have automatically generated usernames
4. New users will automatically get usernames when they sign up

## What the Fix Does

### Database Changes:
- **Generates usernames** ONLY for profiles that don't have them (NULL/empty)
- **PRESERVES existing usernames** - won't modify anyone's current username
- **Updates trigger function** to create usernames automatically for new users
- **Ensures uniqueness** by appending numbers to duplicate usernames
- **Validates format** (lowercase, alphanumeric + underscore, min 3 chars)

### Frontend Changes:
- **Username validation** in the edit form
- **Auto-formatting** of username input
- **Better error handling** for constraint violations
- **Fallback username generation** when creating/updating profiles

## Expected Results
After running the fix:
- ✅ Edit Profile page loads without errors
- ✅ All existing users have valid usernames
- ✅ New users automatically get usernames on signup
- ✅ Username field in edit form works properly with validation
- ✅ Profile URLs work correctly with generated usernames

## Rollback (if needed)
If you need to rollback, you can:
1. Remove the NOT NULL constraint: `ALTER TABLE user_profiles ALTER COLUMN username DROP NOT NULL;`
2. But this is not recommended as usernames are needed for profile URLs
