# Excessive Auth Requests Fix

## Problem
- Continuous GET requests to `/auth/v1/user` were observed almost every second.
- These were caused by numerous `supabase.auth.getUser()` calls throughout the frontend services.
- `getUser()` always hits the Supabase API, so repeated calls flood the network and logs.

## Solution
- Replaced all frontend usages of `supabase.auth.getUser()` with a session-based helper `getCurrentUser()` from `authUtils`.
- `getCurrentUser()` relies on `supabase.auth.getSession()` which reads from local storage and avoids an API call.
- Updated imports in affected service modules: `eventMediaService`, `crewService`, `eventService`, `userService`, `eventRatingService`, `runMigration`, and `googleAvatarService`.

## Result
- Auth queries now rely on cached session data, eliminating the per-second requests to `/auth/v1/user`.
