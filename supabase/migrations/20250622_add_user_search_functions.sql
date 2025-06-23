-- Add enhanced user search functionality
-- This migration adds RPC functions for secure user search including email search

-- Function to search users by email (secure server-side search)
CREATE OR REPLACE FUNCTION search_users_by_email(
  search_query TEXT,
  current_user_id UUID
)
RETURNS TABLE (
  user_id UUID,
  display_name TEXT,
  avatar_url TEXT,
  email TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only allow authenticated users to search
  IF current_user_id IS NULL THEN
    RETURN;
  END IF;

  -- Search for users by email in auth.users table
  -- Join with user_profiles to get display info
  RETURN QUERY
  SELECT 
    up.user_id,
    up.display_name,
    up.avatar_url,
    au.email
  FROM auth.users au
  JOIN user_profiles up ON au.id = up.user_id
  WHERE 
    au.email ILIKE '%' || search_query || '%'
    AND au.id != current_user_id
    AND au.email_confirmed_at IS NOT NULL -- Only confirmed users
  LIMIT 10;
END;
$$;

-- Function to get comprehensive user search results
CREATE OR REPLACE FUNCTION search_users_comprehensive(
  search_query TEXT,
  current_user_id UUID
)
RETURNS TABLE (
  user_id UUID,
  display_name TEXT,
  nickname TEXT,
  avatar_url TEXT,
  email TEXT,
  match_type TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only allow authenticated users to search
  IF current_user_id IS NULL THEN
    RETURN;
  END IF;

  -- Search by display name, nickname, and tagline
  RETURN QUERY
  SELECT 
    up.user_id,
    up.display_name,
    up.nickname,
    up.avatar_url,
    au.email,
    CASE 
      WHEN up.display_name ILIKE '%' || search_query || '%' THEN 'display_name'
      WHEN up.nickname ILIKE '%' || search_query || '%' THEN 'nickname'
      WHEN up.tagline ILIKE '%' || search_query || '%' THEN 'tagline'
      WHEN au.email ILIKE '%' || search_query || '%' THEN 'email'
      ELSE 'other'
    END as match_type
  FROM user_profiles up
  JOIN auth.users au ON up.user_id = au.id
  WHERE 
    (
      up.display_name ILIKE '%' || search_query || '%' OR
      up.nickname ILIKE '%' || search_query || '%' OR
      up.tagline ILIKE '%' || search_query || '%' OR
      au.email ILIKE '%' || search_query || '%'
    )
    AND up.user_id != current_user_id
    AND au.email_confirmed_at IS NOT NULL -- Only confirmed users
  ORDER BY 
    -- Prioritize exact matches
    CASE 
      WHEN up.display_name ILIKE search_query THEN 1
      WHEN up.nickname ILIKE search_query THEN 2
      WHEN au.email ILIKE search_query THEN 3
      ELSE 4
    END,
    up.display_name
  LIMIT 20;
END;
$$;

-- Function to debug user search issues
CREATE OR REPLACE FUNCTION debug_user_search(
  search_query TEXT
)
RETURNS TABLE (
  user_id UUID,
  display_name TEXT,
  nickname TEXT,
  email TEXT,
  email_confirmed BOOLEAN,
  profile_created_at TIMESTAMPTZ,
  auth_created_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Return all users matching the search query for debugging
  RETURN QUERY
  SELECT 
    up.user_id,
    up.display_name,
    up.nickname,
    au.email,
    (au.email_confirmed_at IS NOT NULL) as email_confirmed,
    up.created_at as profile_created_at,
    au.created_at as auth_created_at
  FROM user_profiles up
  FULL OUTER JOIN auth.users au ON up.user_id = au.id
  WHERE 
    up.display_name ILIKE '%' || search_query || '%' OR
    up.nickname ILIKE '%' || search_query || '%' OR
    au.email ILIKE '%' || search_query || '%'
  ORDER BY up.created_at DESC;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION search_users_by_email(TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION search_users_comprehensive(TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION debug_user_search(TEXT) TO authenticated;

-- Add indexes for better search performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_display_name_trgm ON user_profiles USING gin (display_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_user_profiles_nickname_trgm ON user_profiles USING gin (nickname gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_user_profiles_tagline_trgm ON user_profiles USING gin (tagline gin_trgm_ops);

-- Enable trigram extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add comment for documentation
COMMENT ON FUNCTION search_users_by_email IS 'Secure server-side function to search users by email address';
COMMENT ON FUNCTION search_users_comprehensive IS 'Comprehensive user search across multiple fields with match type indication';
COMMENT ON FUNCTION debug_user_search IS 'Debug function to investigate user search issues - returns all matching users';
