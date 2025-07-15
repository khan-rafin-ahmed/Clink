-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.crew_invitations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  crew_id uuid NOT NULL,
  invite_code text NOT NULL UNIQUE,
  created_by uuid NOT NULL,
  expires_at timestamp with time zone,
  max_uses integer,
  current_uses integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT crew_invitations_pkey PRIMARY KEY (id),
  CONSTRAINT crew_invitations_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id),
  CONSTRAINT crew_invitations_crew_id_fkey FOREIGN KEY (crew_id) REFERENCES public.crews(id)
);
CREATE TABLE public.crew_members (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  crew_id uuid NOT NULL,
  user_id uuid NOT NULL,
  status USER-DEFINED NOT NULL DEFAULT 'pending'::crew_member_status,
  invited_by uuid,
  joined_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  role text DEFAULT 'member'::text CHECK (role = ANY (ARRAY['member'::text, 'co_host'::text, 'host'::text])),
  CONSTRAINT crew_members_pkey PRIMARY KEY (id),
  CONSTRAINT crew_members_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES auth.users(id),
  CONSTRAINT crew_members_crew_id_fkey FOREIGN KEY (crew_id) REFERENCES public.crews(id),
  CONSTRAINT crew_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.crews (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  vibe text DEFAULT 'casual'::text CHECK (vibe = ANY (ARRAY['casual'::text, 'party'::text, 'chill'::text, 'wild'::text, 'classy'::text, 'other'::text])),
  visibility USER-DEFINED NOT NULL DEFAULT 'private'::crew_visibility,
  description text,
  created_by uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT crews_pkey PRIMARY KEY (id),
  CONSTRAINT crews_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id)
);
CREATE TABLE public.email_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  recipient text NOT NULL,
  subject text NOT NULL,
  type text NOT NULL CHECK (type = ANY (ARRAY['event_invitation'::text, 'event_reminder'::text, 'crew_invitation'::text, 'welcome'::text, 'password_reset'::text])),
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'sent'::text, 'failed'::text, 'bounced'::text])),
  message_id text,
  data jsonb,
  error_message text,
  sent_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT email_logs_pkey PRIMARY KEY (id)
);
CREATE TABLE public.email_preferences (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  event_invitations boolean DEFAULT true,
  event_reminders boolean DEFAULT true,
  crew_invitations boolean DEFAULT true,
  marketing_emails boolean DEFAULT false,
  email_frequency text DEFAULT 'immediate'::text CHECK (email_frequency = ANY (ARRAY['immediate'::text, 'daily'::text, 'weekly'::text, 'never'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT email_preferences_pkey PRIMARY KEY (id),
  CONSTRAINT email_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.event_comment_reactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  comment_id uuid NOT NULL,
  user_id uuid NOT NULL,
  reaction text NOT NULL CHECK (reaction = ANY (ARRAY['🍻'::text, '🙌'::text, '🤘'::text, '🥴'::text, '😂'::text, '❤️'::text, '🔥'::text])),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT event_comment_reactions_pkey PRIMARY KEY (id),
  CONSTRAINT event_comment_reactions_comment_id_fkey FOREIGN KEY (comment_id) REFERENCES public.event_comments(id),
  CONSTRAINT event_comment_reactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.event_comments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL,
  user_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT event_comments_pkey PRIMARY KEY (id),
  CONSTRAINT event_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT event_comments_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id)
);
CREATE TABLE public.event_invitations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL,
  inviter_id uuid NOT NULL,
  invitee_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'accepted'::text, 'declined'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT event_invitations_pkey PRIMARY KEY (id),
  CONSTRAINT event_invitations_inviter_id_fkey FOREIGN KEY (inviter_id) REFERENCES auth.users(id),
  CONSTRAINT event_invitations_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id),
  CONSTRAINT event_invitations_invitee_id_fkey FOREIGN KEY (invitee_id) REFERENCES auth.users(id)
);
CREATE TABLE public.event_members (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  event_id uuid,
  user_id uuid,
  invited_by uuid,
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'accepted'::text, 'declined'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  invitation_comment text,
  invitation_sent_at timestamp with time zone DEFAULT now(),
  invitation_responded_at timestamp with time zone,
  role text DEFAULT 'attendee'::text CHECK (role = ANY (ARRAY['attendee'::text, 'co_host'::text, 'host'::text])),
  CONSTRAINT event_members_pkey PRIMARY KEY (id),
  CONSTRAINT event_members_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id),
  CONSTRAINT event_members_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES auth.users(id),
  CONSTRAINT event_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.event_photos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL,
  uploaded_by uuid NOT NULL,
  photo_url text NOT NULL,
  storage_path text NOT NULL,
  caption text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT event_photos_pkey PRIMARY KEY (id),
  CONSTRAINT event_photos_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id),
  CONSTRAINT event_photos_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES auth.users(id)
);
CREATE TABLE public.event_ratings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL,
  user_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback_text text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT event_ratings_pkey PRIMARY KEY (id),
  CONSTRAINT event_ratings_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id),
  CONSTRAINT event_ratings_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  date_time timestamp with time zone NOT NULL,
  location text NOT NULL,
  notes text,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  drink_type text CHECK ((drink_type = ANY (ARRAY['beer'::text, 'wine'::text, 'whiskey'::text, 'cocktails'::text, 'shots'::text, 'mixed'::text, 'other'::text])) OR drink_type IS NULL),
  vibe text CHECK ((vibe = ANY (ARRAY['casual'::text, 'party'::text, 'chill'::text, 'wild'::text, 'classy'::text, 'shots'::text, 'other'::text])) OR vibe IS NULL),
  is_public boolean DEFAULT true,
  event_code text UNIQUE CHECK (event_code IS NULL OR event_code ~ '^[A-Z0-9]{6}$'::text),
  latitude double precision CHECK (latitude IS NULL OR latitude >= '-90'::integer::double precision AND latitude <= 90::double precision),
  longitude double precision CHECK (longitude IS NULL OR longitude >= '-180'::integer::double precision AND longitude <= 180::double precision),
  place_id text,
  place_name text,
  crew_id uuid,
  place_nickname text,
  rsvp_count integer DEFAULT 1,
  public_slug text,
  private_slug text,
  cover_image_url text,
  end_time timestamp with time zone,
  duration_type text DEFAULT 'specific_time'::text CHECK (duration_type IS NULL OR (duration_type = ANY (ARRAY['now'::text, 'custom'::text, 'explicit'::text]))),
  duration_hours integer,
  CONSTRAINT events_pkey PRIMARY KEY (id),
  CONSTRAINT events_crew_id_fkey FOREIGN KEY (crew_id) REFERENCES public.crews(id),
  CONSTRAINT events_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id)
);
CREATE TABLE public.follows (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL,
  following_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'accepted'::text, 'rejected'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT follows_pkey PRIMARY KEY (id),
  CONSTRAINT follows_following_id_fkey FOREIGN KEY (following_id) REFERENCES auth.users(id),
  CONSTRAINT follows_follower_id_fkey FOREIGN KEY (follower_id) REFERENCES auth.users(id)
);
CREATE TABLE public.invitation_tokens (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  token text NOT NULL UNIQUE,
  invitation_type text NOT NULL CHECK (invitation_type = ANY (ARRAY['event'::text, 'crew'::text])),
  invitation_id uuid NOT NULL,
  action text NOT NULL CHECK (action = ANY (ARRAY['accept'::text, 'decline'::text])),
  user_id uuid NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  used boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT invitation_tokens_pkey PRIMARY KEY (id),
  CONSTRAINT invitation_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL CHECK (type = ANY (ARRAY['event_invitation'::text, 'event_invitation_response'::text, 'event_update'::text, 'event_rsvp'::text, 'event_reminder'::text, 'event_cancelled'::text, 'event_rating_reminder'::text, 'crew_invitation'::text, 'crew_invitation_response'::text, 'crew_invite_accepted'::text, 'crew_promotion'::text, 'event_promotion'::text, 'crew_join'::text])),
  title text NOT NULL,
  message text NOT NULL,
  data jsonb DEFAULT '{}'::jsonb,
  read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.rsvps (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  event_id uuid,
  user_id uuid,
  status USER-DEFINED NOT NULL DEFAULT 'maybe'::rsvp_status,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT rsvps_pkey PRIMARY KEY (id),
  CONSTRAINT rsvps_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT rsvps_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id)
);
CREATE TABLE public.user_follows (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  follower_id uuid,
  following_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_follows_pkey PRIMARY KEY (id),
  CONSTRAINT user_follows_following_id_fkey FOREIGN KEY (following_id) REFERENCES auth.users(id),
  CONSTRAINT user_follows_follower_id_fkey FOREIGN KEY (follower_id) REFERENCES auth.users(id)
);
CREATE TABLE public.user_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE,
  display_name text,
  bio text,
  avatar_url text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  favorite_drink text,
  tagline text,
  join_date timestamp with time zone DEFAULT now(),
  profile_visibility text DEFAULT 'public'::text CHECK (profile_visibility = ANY (ARRAY['public'::text, 'crew_only'::text, 'private'::text])),
  show_crews_publicly boolean DEFAULT true,
  nickname text,
  email text,
  username text NOT NULL UNIQUE,
  CONSTRAINT user_profiles_pkey PRIMARY KEY (id),
  CONSTRAINT user_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);