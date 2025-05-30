export async function getUserCrews(): Promise<Crew[]> {
  const { data, error } = await supabase.rpc('get_user_crews')

  if (error) throw error

  return (data || []).map((row: any) => ({
    id: row.crew_id,
    name: row.name,
    vibe: row.vibe,
    visibility: row.visibility,
    description: row.description || '',
    created_by: row.created_by,
    created_at: row.created_at || '',
    updated_at: row.updated_at || '',
    member_count: 0,
    is_member: true,
    is_creator: false
  }))
}
