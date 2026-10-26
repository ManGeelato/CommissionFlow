import { createClient } from '@/lib/supabase/server'
import { ServicesClient } from './services-client'

export default async function AdminServicesPage() {
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

  const { data: services } = await supabase
    .from('services')
    .select('*')
    .eq('business_id', business.id)
    .order('created_at', { ascending: false })

  return (
    <ServicesClient 
      services={services || []} 
      businessId={business.id}
    />
  )
}
