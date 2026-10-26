'use client'

import { useState } from 'react'
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
  const [inviteCode, setInviteCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  async function handleJoinBusiness(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // For now, staff needs to be invited by admin
    // This is a placeholder for the invite code flow
    setError('Please ask your business owner to invite you. They can add you from their dashboard.')
    setLoading(false)
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

  // Staff onboarding
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
            <CardTitle className="text-2xl">Join a business</CardTitle>
            <CardDescription>
              Welcome{userName ? `, ${userName}` : ''}! Enter the invite code from your business owner.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleJoinBusiness}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="inviteCode">Invite Code</FieldLabel>
                  <Input
                    id="inviteCode"
                    type="text"
                    placeholder="Enter your invite code"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
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
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Joining...
                  </>
                ) : (
                  'Join Business'
                )}
              </Button>
            </form>

            <p className="text-sm text-muted-foreground text-center mt-4">
              Don&apos;t have an invite code? Ask your business owner to add you from their dashboard.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
