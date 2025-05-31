-- Create crew_invitations table for shareable invite links
-- This table is missing and causing "Invalid invite code" errors

CREATE TABLE IF NOT EXISTS crew_invitations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    crew_id UUID REFERENCES crews(id) ON DELETE CASCADE NOT NULL,
    invite_code TEXT UNIQUE NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    max_uses INTEGER,
    current_uses INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS crew_invitations_invite_code_idx ON crew_invitations(invite_code);
CREATE INDEX IF NOT EXISTS crew_invitations_crew_id_idx ON crew_invitations(crew_id);
CREATE INDEX IF NOT EXISTS crew_invitations_created_by_idx ON crew_invitations(created_by);

-- Enable Row Level Security
ALTER TABLE crew_invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for crew_invitations
-- Crew creators can create invite links
CREATE POLICY "Crew creators can create invite links" ON crew_invitations
FOR INSERT WITH CHECK (
    created_by = auth.uid() AND
    EXISTS (
        SELECT 1 FROM crews
        WHERE id = crew_invitations.crew_id
        AND created_by = auth.uid()
    )
);

-- Crew creators can view their invite links
CREATE POLICY "Crew creators can view their invite links" ON crew_invitations
FOR SELECT USING (
    created_by = auth.uid() OR
    EXISTS (
        SELECT 1 FROM crews
        WHERE id = crew_invitations.crew_id
        AND created_by = auth.uid()
    )
);

-- Anyone can view invite links for joining (but only basic info)
CREATE POLICY "Anyone can view invite links for joining" ON crew_invitations
FOR SELECT USING (true);

-- Crew creators can update their invite links
CREATE POLICY "Crew creators can update invite links" ON crew_invitations
FOR UPDATE USING (
    created_by = auth.uid() OR
    EXISTS (
        SELECT 1 FROM crews
        WHERE id = crew_invitations.crew_id
        AND created_by = auth.uid()
    )
);

-- Crew creators can delete their invite links
CREATE POLICY "Crew creators can delete invite links" ON crew_invitations
FOR DELETE USING (
    created_by = auth.uid() OR
    EXISTS (
        SELECT 1 FROM crews
        WHERE id = crew_invitations.crew_id
        AND created_by = auth.uid()
    )
);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_crew_invitations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE TRIGGER update_crew_invitations_updated_at
    BEFORE UPDATE ON crew_invitations
    FOR EACH ROW EXECUTE FUNCTION update_crew_invitations_updated_at();
