import { createClient } from '@/lib/supabase/server'
import { EntriesClient } from './entries-client'

export default async function AdminEntriesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('owner_id', user!.id)
    .single()

  if (!business) {
    return <div>No business found</div>
  }

  const { data: entries } = await supabase
    .from('entries')
    .select(`
      *,
      staff_profiles!inner(id, display_name)
    `)
    .eq('business_id', business.id)
    .order('created_at', { ascending: false })

  const { data: staffProfiles } = await supabase
    .from('staff_profiles')
    .select('id, display_name')
    .eq('business_id', business.id)
    .eq('status', 'active')

  return (
    <EntriesClient 
      entries={entries || []} 
      staffProfiles={staffProfiles || []}
      businessId={business.id}
    />
  )
}
