import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate } from '@/lib/commission'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Plus } from 'lucide-react'

export default async function StaffEntriesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  const { data: staff } = await supabase.from('staff_profiles').select('id').eq('user_id', user.id).eq('status', 'active').maybeSingle()
  if (!staff) return <p className="text-muted-foreground">No active staff profile found.</p>
  const { data: entries } = await supabase.from('entries').select('*').eq('staff_id', staff.id).order('service_date', { ascending: false }).order('created_at', { ascending: false })
  return <div className="space-y-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h1 className="text-3xl font-bold tracking-tight">My entries</h1><p className="mt-1 text-muted-foreground">Review your services and commission status.</p></div><Button asChild><Link href="/staff/entries/new"><Plus className="mr-2 size-4" />Log a service</Link></Button></div><Card><CardHeader><CardTitle>Entry history</CardTitle></CardHeader><CardContent><div className="overflow-x-auto"><table className="w-full min-w-[680px] text-sm"><thead><tr className="border-b text-left text-muted-foreground"><th className="pb-3 font-medium">Service</th><th className="pb-3 font-medium">Date</th><th className="pb-3 text-right font-medium">Gross</th><th className="pb-3 text-right font-medium">Commission</th><th className="pb-3 text-right font-medium">Status</th></tr></thead><tbody className="divide-y">{(entries ?? []).map((entry) => <tr key={entry.id}><td className="py-4"><p className="font-medium">{entry.service_name}</p>{entry.client_name && <p className="text-xs text-muted-foreground">{entry.client_name}</p>}</td><td className="py-4 text-muted-foreground">{formatDate(entry.service_date)}</td><td className="py-4 text-right">{formatCurrency(Number(entry.gross_amount))}</td><td className="py-4 text-right font-medium">{formatCurrency(Number(entry.commission_amount))}</td><td className="py-4 text-right"><Badge variant={entry.status === 'paid' ? 'default' : entry.status === 'rejected' ? 'destructive' : 'secondary'}>{entry.status}</Badge></td></tr>)}</tbody></table>{(!entries || entries.length === 0) && <div className="py-12 text-center text-sm text-muted-foreground">No entries found.</div>}</div></CardContent></Card></div>
}
