import { createClient } from '@/lib/supabase/server'
import { StaffClient } from './staff-client'

export default async function AdminStaffPage() {
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

  const { data: staffProfiles } = await supabase
    .from('staff_profiles')
    .select('*')
    .eq('business_id', business.id)
    .order('created_at', { ascending: false })

  // Get entry stats per staff
  const { data: entries } = await supabase
    .from('entries')
    .select('staff_id, gross_amount, commission_amount, status')
    .eq('business_id', business.id)

  const staffStats = (staffProfiles || []).map(staff => {
    const staffEntries = (entries || []).filter(e => e.staff_id === staff.id)
    return {
      ...staff,
      totalEntries: staffEntries.length,
      totalRevenue: staffEntries.reduce((sum, e) => sum + Number(e.gross_amount), 0),
      totalCommissions: staffEntries.reduce((sum, e) => sum + Number(e.commission_amount), 0),
      pendingCommissions: staffEntries
        .filter(e => e.status === 'pending' || e.status === 'approved')
        .reduce((sum, e) => sum + Number(e.commission_amount), 0),
    }
  })

  return (
    <StaffClient 
      staffProfiles={staffStats} 
      businessId={business.id}
    />
  )
}
