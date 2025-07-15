# 📱 Thirstee Mobile Database Reference

## 🗄️ **Database Overview**

The Thirstee mobile app uses the **same Supabase database** as the web application, ensuring data consistency across platforms. This reference focuses on mobile-specific considerations and usage patterns.

---

## 🔑 **Core Tables for Mobile**

### **user_profiles** - User Information
```sql
-- Primary user data table
user_profiles {
  id: UUID (Primary Key)
  user_id: UUID (References auth.users)
  display_name: TEXT
  username: TEXT (Unique)
  bio: TEXT
  avatar_url: TEXT
  nickname: TEXT
  favorite_drink: TEXT
  tagline: TEXT
  email: TEXT
  profile_visibility: TEXT ('public', 'crew_only', 'private')
  show_crews_publicly: BOOLEAN
  join_date: TIMESTAMP
  created_at: TIMESTAMP
  updated_at: TIMESTAMP
}
```

**Mobile Usage:**
```typescript
// Get current user profile
const { data: profile } = await supabase
  .from('user_profiles')
  .select('*')
  .eq('user_id', user.id)
  .single()

// Update profile (mobile-optimized)
const { error } = await supabase
  .from('user_profiles')
  .update({
    display_name: newName,
    bio: newBio,
    updated_at: new Date().toISOString()
  })
  .eq('user_id', user.id)
```

### **events** - Event Information
```sql
-- Main events table
events {
  id: UUID (Primary Key)
  title: TEXT
  description: TEXT
  location: TEXT
  latitude: DECIMAL
  longitude: DECIMAL
  place_nickname: TEXT
  start_time: TIMESTAMP
  end_time: TIMESTAMP
  duration_type: TEXT ('specific_time', 'all_night')
  vibe: TEXT ('casual', 'party', 'chill', 'wild', 'classy')
  is_public: BOOLEAN
  max_attendees: INTEGER
  special_notes: TEXT
  created_by: UUID (References auth.users)
  created_at: TIMESTAMP
  updated_at: TIMESTAMP
}
```

**Mobile Usage:**
```typescript
// Get events near user location (mobile-specific)
const { data: nearbyEvents } = await supabase
  .from('events')
  .select(`
    *,
    user_profiles!events_created_by_fkey(display_name, avatar_url),
    event_members(count)
  `)
  .eq('is_public', true)
  .gte('start_time', new Date().toISOString())
  .order('start_time', { ascending: true })
  .limit(20)

// Create event with location data
const { data: newEvent } = await supabase
  .from('events')
  .insert({
    title,
    description,
    location,
    latitude: locationData.latitude,
    longitude: locationData.longitude,
    start_time,
    vibe,
    created_by: user.id
  })
  .select()
  .single()
```

### **event_members** - Event Participation
```sql
-- Event membership and RSVP status
event_members {
  id: UUID (Primary Key)
  event_id: UUID (References events)
  user_id: UUID (References auth.users)
  status: TEXT ('pending', 'going', 'maybe', 'not_going')
  role: TEXT ('attendee', 'co_host', 'host')
  invited_by: UUID (References auth.users)
  invitation_comment: TEXT
  invitation_sent_at: TIMESTAMP
  invitation_responded_at: TIMESTAMP
  created_at: TIMESTAMP
  updated_at: TIMESTAMP
}
```

**Mobile Usage:**
```typescript
// RSVP to event
const { error } = await supabase
  .from('event_members')
  .upsert({
    event_id: eventId,
    user_id: user.id,
    status: 'going',
    invitation_responded_at: new Date().toISOString()
  })

// Get user's upcoming events
const { data: userEvents } = await supabase
  .from('event_members')
  .select(`
    *,
    events(
      id, title, location, start_time, vibe,
      user_profiles!events_created_by_fkey(display_name)
    )
  `)
  .eq('user_id', user.id)
  .eq('status', 'going')
  .gte('events.start_time', new Date().toISOString())
```

---

## 📱 **Mobile-Specific Queries**

### **Location-Based Queries**
```typescript
// Find events within radius (using PostGIS if available)
const findNearbyEvents = async (latitude: number, longitude: number, radiusKm: number = 10) => {
  const { data } = await supabase.rpc('find_nearby_events', {
    user_lat: latitude,
    user_lng: longitude,
    radius_km: radiusKm
  })
  return data
}

// Alternative: Client-side distance filtering
const filterEventsByDistance = (events: Event[], userLat: number, userLng: number) => {
  return events.filter(event => {
    if (!event.latitude || !event.longitude) return true
    const distance = calculateDistance(userLat, userLng, event.latitude, event.longitude)
    return distance <= 50 // 50km radius
  })
}
```

### **Real-time Subscriptions**
```typescript
// Subscribe to event updates (mobile-optimized)
const subscribeToEventUpdates = (eventId: string, callback: (payload: any) => void) => {
  return supabase
    .channel(`event-${eventId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'events',
        filter: `id=eq.${eventId}`
      },
      callback
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'event_members',
        filter: `event_id=eq.${eventId}`
      },
      callback
    )
    .subscribe()
}

// Subscribe to user notifications
const subscribeToNotifications = (userId: string, callback: (payload: any) => void) => {
  return supabase
    .channel(`notifications-${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      },
      callback
    )
    .subscribe()
}
```

### **Offline-First Queries**
```typescript
// Cache-friendly queries for offline support
const getCachedUserData = async (userId: string) => {
  // Use React Query with long stale time for offline support
  return useQuery({
    queryKey: ['user', userId],
    queryFn: () => getUserProfile(userId),
    staleTime: 10 * 60 * 1000, // 10 minutes
    cacheTime: 24 * 60 * 60 * 1000, // 24 hours
    retry: 3
  })
}

// Optimistic updates for better UX
const optimisticRSVP = async (eventId: string, status: RSVPStatus) => {
  // Update UI immediately
  queryClient.setQueryData(['event', eventId], (old: Event) => ({
    ...old,
    userRSVPStatus: status
  }))
  
  // Then sync with server
  try {
    await updateRSVPStatus(eventId, status)
  } catch (error) {
    // Revert on error
    queryClient.invalidateQueries(['event', eventId])
    throw error
  }
}
```

---

## 🔐 **Authentication & Security**

### **Row Level Security (RLS)**
```sql
-- User profiles: Users can only edit their own profile
CREATE POLICY "Users can view public profiles" ON user_profiles
  FOR SELECT USING (
    profile_visibility = 'public' OR 
    user_id = auth.uid() OR
    (profile_visibility = 'crew_only' AND users_share_crew(auth.uid(), user_id))
  );

-- Events: Public events visible to all, private events to members only
CREATE POLICY "Public events are viewable by everyone" ON events
  FOR SELECT USING (
    is_public = true OR 
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM event_members 
      WHERE event_id = events.id AND user_id = auth.uid()
    )
  );
```

### **Mobile Auth Patterns**
```typescript
// Check authentication status
const checkAuthStatus = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  return !!session?.user
}

// Handle auth state changes
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN') {
    // Redirect to main app
    navigation.navigate('Main')
  } else if (event === 'SIGNED_OUT') {
    // Clear cache and redirect to login
    queryClient.clear()
    navigation.navigate('Login')
  }
})
```

---

## 📊 **Performance Optimization**

### **Efficient Data Fetching**
```typescript
// Paginated queries for large datasets
const getEventsPaginated = async (page: number = 0, limit: number = 20) => {
  const { data, error } = await supabase
    .from('events')
    .select(`
      id, title, location, start_time, vibe,
      user_profiles!events_created_by_fkey(display_name, avatar_url)
    `)
    .eq('is_public', true)
    .gte('start_time', new Date().toISOString())
    .order('start_time', { ascending: true })
    .range(page * limit, (page + 1) * limit - 1)
    
  return { data, error, hasMore: data?.length === limit }
}

// Selective field queries to reduce data transfer
const getEventPreview = async (eventId: string) => {
  return supabase
    .from('events')
    .select('id, title, location, start_time, vibe')
    .eq('id', eventId)
    .single()
}

const getEventDetails = async (eventId: string) => {
  return supabase
    .from('events')
    .select(`
      *,
      user_profiles!events_created_by_fkey(display_name, avatar_url, username),
      event_members(
        id, status, role,
        user_profiles!event_members_user_id_fkey(display_name, avatar_url)
      )
    `)
    .eq('id', eventId)
    .single()
}
```

### **Caching Strategy**
```typescript
// React Query configuration for mobile
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,     // 5 minutes
      cacheTime: 30 * 60 * 1000,    // 30 minutes
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        if (error?.status >= 400 && error?.status < 500) {
          return false
        }
        return failureCount < 3
      }
    }
  }
})

// Cache keys for consistency
export const QUERY_KEYS = {
  user: (id: string) => ['user', id],
  userProfile: (id: string) => ['userProfile', id],
  events: (filters?: any) => ['events', filters],
  event: (id: string) => ['event', id],
  eventMembers: (eventId: string) => ['eventMembers', eventId],
  userEvents: (userId: string) => ['userEvents', userId],
  notifications: (userId: string) => ['notifications', userId]
}
```

---

## 🔄 **Data Synchronization**

### **Conflict Resolution**
```typescript
// Handle optimistic update conflicts
const handleUpdateConflict = async (localData: any, serverData: any) => {
  // Simple last-write-wins strategy
  if (new Date(serverData.updated_at) > new Date(localData.updated_at)) {
    return serverData
  }
  
  // Or show conflict resolution UI
  return await showConflictResolutionModal(localData, serverData)
}

// Sync pending changes when coming back online
const syncPendingChanges = async () => {
  const pendingChanges = await AsyncStorage.getItem('pendingChanges')
  if (pendingChanges) {
    const changes = JSON.parse(pendingChanges)
    for (const change of changes) {
      try {
        await applyChange(change)
      } catch (error) {
        console.error('Failed to sync change:', error)
      }
    }
    await AsyncStorage.removeItem('pendingChanges')
  }
}
```

---

## 📱 **Mobile-Specific Considerations**

### **Data Usage Optimization**
- Use selective field queries to minimize data transfer
- Implement image compression for avatar uploads
- Cache frequently accessed data locally
- Use pagination for large lists

### **Offline Support**
- Cache critical user data (profile, upcoming events)
- Queue mutations for when connection is restored
- Show appropriate offline indicators
- Graceful degradation of features

### **Battery Optimization**
- Limit real-time subscriptions to active screens
- Use efficient polling intervals
- Batch database operations when possible
- Implement proper cleanup in useEffect hooks

This database reference provides mobile developers with the essential information needed to work effectively with the Thirstee database while considering mobile-specific constraints and optimizations.
