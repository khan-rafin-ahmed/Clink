-- Add privacy field to events table
ALTER TABLE events ADD COLUMN is_public BOOLEAN DEFAULT true;

-- Create user_profiles table for extended user information
CREATE TABLE user_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    display_name TEXT,
    bio TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_follows table for follow relationships
CREATE TABLE user_follows (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    follower_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    following_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(follower_id, following_id),
    CHECK (follower_id != following_id)
);

-- Create event_members table for private event invitations
CREATE TABLE event_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    invited_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(event_id, user_id)
);

-- Create indexes for better query performance
CREATE INDEX events_is_public_idx ON events(is_public);
CREATE INDEX user_follows_follower_idx ON user_follows(follower_id);
CREATE INDEX user_follows_following_idx ON user_follows(following_id);
CREATE INDEX event_members_event_idx ON event_members(event_id);
CREATE INDEX event_members_user_idx ON event_members(user_id);
CREATE INDEX user_profiles_user_id_idx ON user_profiles(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_members ENABLE ROW LEVEL SECURITY;

-- Create policies for user_profiles table
CREATE POLICY "User profiles are viewable by everyone"
    ON user_profiles FOR SELECT
    USING (true);

CREATE POLICY "Users can create their own profile"
    ON user_profiles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
    ON user_profiles FOR UPDATE
    USING (auth.uid() = user_id);

-- Create policies for user_follows table
CREATE POLICY "User follows are viewable by everyone"
    ON user_follows FOR SELECT
    USING (true);

CREATE POLICY "Users can follow others"
    ON user_follows FOR INSERT
    WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow others"
    ON user_follows FOR DELETE
    USING (auth.uid() = follower_id);

-- Create policies for event_members table
CREATE POLICY "Event members can view their own memberships"
    ON event_members FOR SELECT
    USING (auth.uid() = user_id OR auth.uid() = invited_by OR 
           auth.uid() IN (SELECT created_by FROM events WHERE id = event_id));

CREATE POLICY "Event creators can invite members"
    ON event_members FOR INSERT
    WITH CHECK (auth.uid() = invited_by AND 
                auth.uid() IN (SELECT created_by FROM events WHERE id = event_id));

CREATE POLICY "Event creators and invitees can update memberships"
    ON event_members FOR UPDATE
    USING (auth.uid() = user_id OR 
           auth.uid() IN (SELECT created_by FROM events WHERE id = event_id));

CREATE POLICY "Event creators can remove members"
    ON event_members FOR DELETE
    USING (auth.uid() IN (SELECT created_by FROM events WHERE id = event_id) OR 
           auth.uid() = user_id);

-- Update events policies to handle privacy
DROP POLICY "Events are viewable by everyone" ON events;

CREATE POLICY "Public events are viewable by everyone"
    ON events FOR SELECT
    USING (is_public = true);

CREATE POLICY "Private events are viewable by creator and invited members"
    ON events FOR SELECT
    USING (is_public = false AND (
        auth.uid() = created_by OR 
        auth.uid() IN (
            SELECT user_id FROM event_members 
            WHERE event_id = events.id AND status = 'accepted'
        )
    ));

-- Create function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_profiles (user_id, display_name)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create user profile
CREATE TRIGGER create_user_profile_trigger
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_user_profile();
