import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/commission'
import { DollarSign, Users, FileText, Clock, TrendingUp, CheckCircle } from 'lucide-react'
import { RecentEntriesTable } from '@/components/admin/recent-entries-table'
import { RevenueChart } from '@/components/admin/revenue-chart'

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Get business
  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('owner_id', user!.id)
    .single()

  if (!business) {
    return <div>No business found</div>
  }

  // Get stats
  const { data: entries } = await supabase
    .from('entries')
    .select('*')
    .eq('business_id', business.id)

  const { data: staffProfiles } = await supabase
    .from('staff_profiles')
    .select('*')
    .eq('business_id', business.id)
    .eq('status', 'active')

  const allEntries = entries || []
  const totalRevenue = allEntries.reduce((sum, e) => sum + Number(e.gross_amount), 0)
  const totalCommissions = allEntries.reduce((sum, e) => sum + Number(e.commission_amount), 0)
  const pendingEntries = allEntries.filter(e => e.status === 'pending')
  const approvedEntries = allEntries.filter(e => e.status === 'approved')
  const paidEntries = allEntries.filter(e => e.status === 'paid')

  // Get recent entries with staff names
  const { data: recentEntries } = await supabase
    .from('entries')
    .select(`
      *,
      staff_profiles!inner(display_name)
    `)
    .eq('business_id', business.id)
    .order('created_at', { ascending: false })
    .limit(10)

  // Calculate monthly data for chart
  const now = new Date()
  const monthlyData = []
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthStart = date.toISOString().split('T')[0]
    const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 1)
    const monthEnd = nextMonth.toISOString().split('T')[0]
    
    const monthEntries = allEntries.filter(e => 
      e.service_date >= monthStart && e.service_date < monthEnd
    )
    
    monthlyData.push({
      month: date.toLocaleDateString('en-US', { month: 'short' }),
      revenue: monthEntries.reduce((sum, e) => sum + Number(e.gross_amount), 0),
      commissions: monthEntries.reduce((sum, e) => sum + Number(e.commission_amount), 0),
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here&apos;s an overview of your business.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(totalRevenue)}
          icon={<TrendingUp className="w-5 h-5" />}
          description="All time"
        />
        <StatCard
          title="Total Commissions"
          value={formatCurrency(totalCommissions)}
          icon={<DollarSign className="w-5 h-5" />}
          description="All time"
        />
        <StatCard
          title="Active Staff"
          value={staffProfiles?.length?.toString() || '0'}
          icon={<Users className="w-5 h-5" />}
          description="Team members"
        />
        <StatCard
          title="Pending Approval"
          value={pendingEntries.length.toString()}
          icon={<Clock className="w-5 h-5" />}
          description={`${approvedEntries.length} approved, ${paidEntries.length} paid`}
        />
      </div>

      {/* Chart and Recent Entries */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Revenue Overview</CardTitle>
            <CardDescription>Monthly revenue and commissions</CardDescription>
          </CardHeader>
          <CardContent>
            <RevenueChart data={monthlyData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Recent Entries</CardTitle>
              <CardDescription>Latest commission entries</CardDescription>
            </div>
            <FileText className="w-5 h-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <RecentEntriesTable entries={recentEntries || []} />
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-warning-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingEntries.length}</p>
                <p className="text-sm text-muted-foreground">Pending entries</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{approvedEntries.length}</p>
                <p className="text-sm text-muted-foreground">Approved entries</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatCurrency(paidEntries.reduce((sum, e) => sum + Number(e.commission_amount), 0))}</p>
                <p className="text-sm text-muted-foreground">Paid out</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function StatCard({ 
  title, 
  value, 
  icon, 
  description 
}: { 
  title: string
  value: string
  icon: React.ReactNode
  description: string
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
