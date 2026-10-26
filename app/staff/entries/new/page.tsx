'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Calculator, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { calculateCommission, formatCurrency } from '@/lib/commission'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

type Service = { id: string; name: string; default_price: number }
type Staff = { id: string; business_id: string; commission_rate: number; commission_type: 'percentage' | 'flat' | 'tiered'; tiered_rates: { min: number; max: number | null; rate: number }[] }

export default function NewEntryPage() {
  const router = useRouter()
  const [services, setServices] = useState<Service[]>([])
  const [staff, setStaff] = useState<Staff | null>(null)
  const [serviceId, setServiceId] = useState('')
  const [amount, setAmount] = useState('')
  const [clientName, setClientName] = useState('')
  const [serviceDate, setServiceDate] = useState(new Date().toISOString().slice(0, 10))
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const selectedService = services.find((service) => service.id === serviceId)
  const commission = staff && amount ? calculateCommission(Number(amount), staff.commission_type, Number(staff.commission_rate), staff.tiered_rates) : 0

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/auth/login'); return }
      const { data: profile } = await supabase.from('staff_profiles').select('id, business_id, commission_rate, commission_type, tiered_rates').eq('user_id', user.id).eq('status', 'active').maybeSingle()
      if (!profile) { setLoading(false); return }
      setStaff(profile)
      const { data: catalog } = await supabase.from('services').select('id, name, default_price').eq('business_id', profile.business_id).eq('is_active', true).order('name')
      setServices(catalog ?? [])
      setLoading(false)
    }
    load()
  }, [router])

  function selectService(value: string) { setServiceId(value); const service = services.find((item) => item.id === value); if (service && !amount) setAmount(String(service.default_price)) }
  async function submit(event: React.FormEvent) { event.preventDefault(); if (!staff || !serviceId || Number(amount) <= 0) return toast.error('Select a service and enter a valid amount.'); setSaving(true); const supabase = createClient(); const service = services.find((item) => item.id === serviceId); const { error } = await supabase.from('entries').insert({ business_id: staff.business_id, staff_id: staff.id, service_id: serviceId, service_name: service?.name ?? 'Service', client_name: clientName || null, service_date: serviceDate, gross_amount: Number(amount), commission_rate: Number(staff.commission_rate), commission_type: staff.commission_type, commission_amount: commission, notes: notes || null }); setSaving(false); if (error) { toast.error(error.message); return } toast.success('Service entry submitted for approval.'); router.push('/staff/entries') }

  if (loading) return <div className="flex min-h-[50vh] items-center justify-center"><Loader2 className="size-6 animate-spin text-primary" /></div>
  if (!staff) return <Card className="mx-auto mt-16 max-w-lg"><CardContent className="p-8 text-center"><CardTitle>Staff profile unavailable</CardTitle><p className="mt-2 text-sm text-muted-foreground">Ask your administrator to activate your profile before logging services.</p></CardContent></Card>
  return <div className="mx-auto max-w-2xl space-y-6"><Button variant="ghost" asChild><Link href="/staff"><ArrowLeft className="mr-2 size-4" />Back to overview</Link></Button><div><h1 className="text-3xl font-bold tracking-tight">Log a service</h1><p className="mt-1 text-muted-foreground">Submit a completed service for administrator approval.</p></div><form onSubmit={submit}><Card><CardHeader><CardTitle>Service details</CardTitle><CardDescription>Commission is calculated from your current staff rate.</CardDescription></CardHeader><CardContent className="space-y-5"><div className="space-y-2"><Label htmlFor="service">Service</Label><Select value={serviceId} onValueChange={selectService}><SelectTrigger id="service"><SelectValue placeholder="Choose a service" /></SelectTrigger><SelectContent>{services.map((service) => <SelectItem key={service.id} value={service.id}>{service.name} · {formatCurrency(Number(service.default_price))}</SelectItem>)}</SelectContent></Select>{services.length === 0 && <p className="text-xs text-muted-foreground">No active services are available yet.</p>}</div><div className="grid gap-5 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="amount">Gross amount</Label><Input id="amount" type="number" min="0.01" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0.00" required /></div><div className="space-y-2"><Label htmlFor="date">Service date</Label><Input id="date" type="date" value={serviceDate} onChange={(event) => setServiceDate(event.target.value)} required /></div></div><div className="space-y-2"><Label htmlFor="client">Client name <span className="font-normal text-muted-foreground">(optional)</span></Label><Input id="client" value={clientName} onChange={(event) => setClientName(event.target.value)} placeholder="e.g. Jordan Lee" /></div><div className="space-y-2"><Label htmlFor="notes">Notes <span className="font-normal text-muted-foreground">(optional)</span></Label><Textarea id="notes" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Add any helpful context..." rows={4} /></div><div className="flex items-center justify-between rounded-xl border bg-primary/5 p-4"><div className="flex items-center gap-3"><Calculator className="size-5 text-primary" /><div><p className="text-sm font-medium">Estimated commission</p><p className="text-xs text-muted-foreground">Based on your {staff.commission_type} rate</p></div></div><p className="text-2xl font-bold text-primary">{formatCurrency(commission)}</p></div><div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><Button type="button" variant="outline" asChild><Link href="/staff">Cancel</Link></Button><Button type="submit" disabled={saving || !serviceId}>{saving && <Loader2 className="mr-2 size-4 animate-spin" />}Submit for approval</Button></div></CardContent></Card></form></div>
}
