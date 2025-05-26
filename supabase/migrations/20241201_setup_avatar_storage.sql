-- Create storage bucket for avatars
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for avatar bucket
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own avatar" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own avatar" ON storage.objects
FOR DELETE USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create a function to clean up old avatars when a new one is uploaded
CREATE OR REPLACE FUNCTION cleanup_old_avatars()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete old avatar files when avatar_url is updated
  IF OLD.avatar_url IS NOT NULL AND NEW.avatar_url IS DISTINCT FROM OLD.avatar_url THEN
    -- Extract the file path from the old URL
    DECLARE
      old_path TEXT;
    BEGIN
      -- Extract path from URL (assuming format: .../storage/v1/object/public/avatars/path)
      old_path := substring(OLD.avatar_url from '/avatars/(.*)$');
      
      IF old_path IS NOT NULL THEN
        -- Delete the old file from storage
        DELETE FROM storage.objects 
        WHERE bucket_id = 'avatars' AND name = old_path;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      -- Log error but don't fail the update
      RAISE WARNING 'Failed to cleanup old avatar: %', SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to cleanup old avatars
DROP TRIGGER IF EXISTS cleanup_old_avatars_trigger ON user_profiles;
CREATE TRIGGER cleanup_old_avatars_trigger
  AFTER UPDATE OF avatar_url ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_old_avatars();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA storage TO authenticated;
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;
