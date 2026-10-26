import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowRight, CalendarDays, CheckCircle2, Clock3, DollarSign, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatShortDate } from '@/lib/commission'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default async function StaffDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()
  const { data: staff } = await supabase.from('staff_profiles').select('*, businesses(name)').eq('user_id', user.id).eq('status', 'active').limit(1).maybeSingle()
  if (!staff) return <EmptyStaffState />

  const { data: entries } = await supabase.from('entries').select('*').eq('staff_id', staff.id).order('service_date', { ascending: false }).order('created_at', { ascending: false })
  const allEntries = entries ?? []
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
  const monthEntries = allEntries.filter((entry) => entry.service_date >= monthStart)
  const approved = allEntries.filter((entry) => entry.status === 'approved' || entry.status === 'paid')
  const paid = allEntries.filter((entry) => entry.status === 'paid')
  const pending = allEntries.filter((entry) => entry.status === 'pending')
  const monthEarnings = monthEntries.filter((entry) => entry.status !== 'rejected').reduce((sum, entry) => sum + Number(entry.commission_amount), 0)
  const approvedEarnings = approved.reduce((sum, entry) => sum + Number(entry.commission_amount), 0)
  const paidEarnings = paid.reduce((sum, entry) => sum + Number(entry.commission_amount), 0)

  return <div className="space-y-8">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div><p className="text-sm text-muted-foreground">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p><h1 className="mt-1 text-3xl font-bold tracking-tight">Welcome back, {profile?.full_name?.split(' ')[0] || 'there'}</h1><p className="mt-1 text-muted-foreground">Here&apos;s your commission snapshot.</p></div>
      <Button asChild><Link href="/staff/entries/new"><Plus className="mr-2 size-4" />Log a service</Link></Button>
    </div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard label="This month" value={formatCurrency(monthEarnings)} detail="Projected earnings" icon={<CalendarDays className="size-5" />} />
      <MetricCard label="Approved earnings" value={formatCurrency(approvedEarnings)} detail="Ready for payout" icon={<CheckCircle2 className="size-5" />} />
      <MetricCard label="Paid out" value={formatCurrency(paidEarnings)} detail="All-time paid" icon={<DollarSign className="size-5" />} />
      <MetricCard label="Awaiting review" value={String(pending.length)} detail="Pending entries" icon={<Clock3 className="size-5" />} />
    </div>
    <Card><CardHeader className="flex flex-row items-center justify-between"><div><CardTitle>Recent entries</CardTitle><p className="mt-1 text-sm text-muted-foreground">Your latest logged services and payout status.</p></div><Button variant="ghost" asChild><Link href="/staff/entries">View all <ArrowRight className="ml-2 size-4" /></Link></Button></CardHeader><CardContent><div className="divide-y">{allEntries.slice(0, 5).map((entry) => <div key={entry.id} className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"><div className="min-w-0"><p className="truncate font-medium">{entry.service_name}</p><p className="text-sm text-muted-foreground">{formatShortDate(entry.service_date)}{entry.client_name ? ` · ${entry.client_name}` : ''}</p></div><div className="text-right"><p className="font-semibold">{formatCurrency(Number(entry.commission_amount))}</p><Badge variant={entry.status === 'paid' ? 'default' : entry.status === 'rejected' ? 'destructive' : 'secondary'}>{entry.status}</Badge></div></div>)}{allEntries.length === 0 && <div className="py-10 text-center text-sm text-muted-foreground">No entries yet. Log your first service to get started.</div>}</div></CardContent></Card>
  </div>
}

function MetricCard({ label, value, detail, icon }: { label: string; value: string; detail: string; icon: React.ReactNode }) { return <Card><CardContent className="p-5"><div className="mb-4 flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">{icon}</div><p className="text-sm text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-bold">{value}</p><p className="mt-1 text-xs text-muted-foreground">{detail}</p></CardContent></Card> }
function EmptyStaffState() { return <Card className="mx-auto mt-16 max-w-lg"><CardContent className="p-8 text-center"><h1 className="text-xl font-semibold">Your staff profile is still being set up</h1><p className="mt-2 text-sm text-muted-foreground">Ask your business administrator to activate your CommissionFlow account.</p></CardContent></Card> }
