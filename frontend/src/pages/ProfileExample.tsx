import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

interface Profile {
  id: string
  display_name: string | null
}

export function ProfileExample() {
  const [profile, setProfile] = useState<Profile | null>(null)

  // Fetch profile once when the component mounts
  useEffect(() => {
    supabase
      .from('user_profiles')
      .select('*')
      .limit(1)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setProfile(data[0] as Profile)
        }
      })
  }, [])

  // Example React Query usage with manual refetch
  const { data, refetch } = useQuery({
    queryKey: ['profile', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return null
      const { data } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', profile.id)
        .single()
      return data as Profile
    },
    enabled: !!profile,
    refetchOnWindowFocus: false,
  })

  return (
    <div>
      <h1>Profile Example</h1>
      <pre>{JSON.stringify(profile, null, 2)}</pre>
      <pre>Query: {JSON.stringify(data, null, 2)}</pre>
      <button onClick={() => refetch()}>Refetch</button>
    </div>
  )
}
