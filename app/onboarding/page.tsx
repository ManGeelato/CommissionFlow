import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { OnboardingClient } from './onboarding-client'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Check if user has a profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const role = profile?.role || user.user_metadata?.role || 'staff'

  // Check if admin has a business already
  if (role === 'admin') {
    const { data: business } = await supabase
      .from('businesses')
      .select('id, slug')
      .eq('owner_id', user.id)
      .single()

    if (business) {
      redirect('/admin')
    }
  }

  // Check if staff is linked to a business
  if (role === 'staff') {
    const { data: staffProfile } = await supabase
      .from('staff_profiles')
      .select('id, business_id')
      .eq('user_id', user.id)
      .single()

    if (staffProfile) {
      redirect('/staff')
    }
  }

  return <OnboardingClient role={role} userEmail={user.email || ''} userName={profile?.full_name || user.user_metadata?.full_name || ''} />
}
