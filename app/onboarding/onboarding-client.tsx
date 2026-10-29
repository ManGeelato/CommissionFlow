'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field'
import { DollarSign, Loader2, Building2, UserPlus } from 'lucide-react'

interface OnboardingClientProps {
  role: string
  userEmail: string
  userName: string
}

export function OnboardingClient({ role, userName }: OnboardingClientProps) {
  const router = useRouter()
  const [businessName, setBusinessName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // useEffect(() => {
  //   if (role === 'admin') return

  //   let cancelled = false

  //   async function checkStaffMembership() {
  //     const supabase = createClient()

  //     const {
  //       data: { user },
  //       error: authError,
  //     } = await supabase.auth.getUser()

  //     if (authError || !user) {
  //       if (!cancelled) setError('Please log in again.')
  //       return
  //     }

  //     const { data: staff, error: staffError } = await supabase
  //       .from('staff_profiles')
  //       .select('user_id, business_id, display_name, status')
  //       .eq('user_id', user.id)
  //       .maybeSingle()

  //     if (cancelled) return

  //     if (staffError) {
  //       setError(staffError.message)
  //       return
  //     }

  //     if (staff?.business_id && staff.status === 'active') {
  //       router.replace('/staff')
  //       router.refresh()
  //       return
  //     }

  //     setError(null)
  //   }

  //   checkStaffMembership()

  //   return () => {
  //     cancelled = true
  //   }
  // }, [role, router])

  
useEffect(() => {
  if (role === 'admin') return

  async function checkStaffMembership() {
    const supabase = createClient()

    console.log('[Onboarding] Checking staff membership...')

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('[Onboarding] Auth error:', authError)
      setError(authError?.message || 'No authenticated user found.')
      return
    }

    console.log('[Onboarding] Logged-in user ID:', user.id)
    console.log('[Onboarding] Logged-in email:', user.email)

    const { data: staff, error: staffError } = await supabase
      .from('staff_profiles')
      .select('id, user_id, business_id, display_name, status')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle()

    if (staffError) {
      console.error('[Onboarding] Staff query error:', staffError)
      setError(`Staff lookup failed: ${staffError.message}`)
      return
    }

    console.log('[Onboarding] Staff record:', staff)

    if (!staff) {
      setError(
        `No staff record found for your logged-in account (${user.email}).`
      )
      return
    }

    if (staff.status !== 'active') {
      setError(`Your staff account status is "${staff.status}".`)
      return
    }

    if (!staff.business_id) {
      setError('Your staff record has no linked business.')
      return
    }

    console.log('[Onboarding] Membership confirmed. Redirecting...')
    window.location.assign('/staff')
  }

  checkStaffMembership()
}, [role])


  async function handleCreateBusiness(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setError('Not authenticated')
      setLoading(false)
      return
    }

    // Create slug from business name
    const slug = businessName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    const { error: insertError } = await supabase
      .from('businesses')
      .insert({
        name: businessName,
        slug: `${slug}-${Date.now().toString(36)}`,
        owner_id: user.id,
      })

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    router.push('/admin')
    router.refresh()
  }


  if (role === 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md">
          <div className="flex justify-center mb-8">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="font-semibold text-xl">CommissionFlow</span>
            </div>
          </div>

          <Card>
            <CardHeader className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Set up your business</CardTitle>
              <CardDescription>
                Welcome{userName ? `, ${userName}` : ''}! Let&apos;s create your business to get started.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateBusiness}>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="businessName">Business Name</FieldLabel>
                    <Input
                      id="businessName"
                      type="text"
                      placeholder="e.g., Luxe Hair Salon"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      required
                    />
                  </Field>
                </FieldGroup>

                {error && (
                  <div className="mt-4 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                    {error}
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full mt-6" 
                  disabled={loading || !businessName.trim()}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating business...
                    </>
                  ) : (
                    'Create Business'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Staff onboarding: the admin links the registered email from their dashboard.
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="font-semibold text-xl">CommissionFlow</span>
          </div>
        </div>
        <Card>
          <CardHeader className="text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <UserPlus className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Waiting for your business</CardTitle>
            <CardDescription>
              Welcome{userName ? `, ${userName}` : ''}! Your business owner must add this registered email from their Staff dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            {error && (
              <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                {error}
              </div>
            )}
            <p className="text-sm text-muted-foreground">
              Once you are added, refresh this page and you will be taken directly to your staff dashboard. No invite code is required.
            </p>
            <Button className="w-full" onClick={() => window.location.reload()}>
              Check again
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
