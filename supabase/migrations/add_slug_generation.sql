-- Add slug generation function and update existing events
-- This works with the existing schema

-- Function to generate unique slugs
CREATE OR REPLACE FUNCTION generate_event_slug(event_title TEXT, is_public_event BOOLEAN DEFAULT true)
RETURNS TEXT AS $$
DECLARE
    base_slug TEXT;
    final_slug TEXT;
    counter INTEGER := 0;
    slug_exists BOOLEAN;
BEGIN
    -- Create base slug from title
    base_slug := lower(regexp_replace(event_title, '[^a-zA-Z0-9\s]', '', 'g'));
    base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
    base_slug := trim(both '-' from base_slug);
    
    -- Limit length
    IF length(base_slug) > 50 THEN
        base_slug := substring(base_slug from 1 for 50);
    END IF;
    
    -- If empty, use default
    IF base_slug = '' THEN
        base_slug := 'event';
    END IF;
    
    -- For private events, add random suffix for security
    IF NOT is_public_event THEN
        base_slug := base_slug || '-' || substring(gen_random_uuid()::text from 1 for 8);
    END IF;
    
    final_slug := base_slug;
    
    -- Check for uniqueness and increment if needed
    LOOP
        IF is_public_event THEN
            SELECT EXISTS(SELECT 1 FROM events WHERE public_slug = final_slug) INTO slug_exists;
        ELSE
            SELECT EXISTS(SELECT 1 FROM events WHERE private_slug = final_slug) INTO slug_exists;
        END IF;
        
        IF NOT slug_exists THEN
            EXIT;
        END IF;
        
        counter := counter + 1;
        final_slug := base_slug || '-' || counter;
    END LOOP;
    
    RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Update existing events with slugs (safe approach)
DO $$
DECLARE
    event_record RECORD;
    new_slug TEXT;
    events_updated INTEGER := 0;
BEGIN
    -- Only update events that don't have slugs yet
    FOR event_record IN 
        SELECT id, title, COALESCE(is_public, true) as is_public 
        FROM events 
        WHERE public_slug IS NULL AND private_slug IS NULL
    LOOP
        BEGIN
            -- Generate slug based on is_public status
            new_slug := generate_event_slug(event_record.title, event_record.is_public);
            
            -- Update the event with appropriate slug
            IF event_record.is_public THEN
                UPDATE events SET 
                    public_slug = new_slug 
                WHERE id = event_record.id;
            ELSE
                UPDATE events SET 
                    private_slug = new_slug 
                WHERE id = event_record.id;
            END IF;
            
            events_updated := events_updated + 1;
            
        EXCEPTION
            WHEN OTHERS THEN
                -- Log error but continue with other events
                RAISE NOTICE 'Error updating event %: %', event_record.id, SQLERRM;
        END;
    END LOOP;
    
    RAISE NOTICE 'Updated % events with slugs', events_updated;
END $$;
