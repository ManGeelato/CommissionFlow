'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatCurrency, formatDate, getStatusBadgeVariant } from '@/lib/commission'
import { Search, MoreHorizontal, CheckCircle, XCircle, DollarSign, Loader2 } from 'lucide-react'

interface Entry {
  id: string
  service_name: string
  client_name: string | null
  gross_amount: number
  commission_amount: number
  commission_rate: number
  service_date: string
  status: string
  created_at: string
  staff_profiles: {
    id: string
    display_name: string
  }
}

interface StaffProfile {
  id: string
  display_name: string
}

interface EntriesClientProps {
  entries: Entry[]
  staffProfiles: StaffProfile[]
  businessId: string
}

export function EntriesClient({ entries: initialEntries, staffProfiles, businessId }: EntriesClientProps) {
  const router = useRouter()
  const [entries, setEntries] = useState(initialEntries)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [staffFilter, setStaffFilter] = useState<string>('all')
  const [loading, setLoading] = useState<string | null>(null)

  const filteredEntries = entries.filter(entry => {
    const matchesSearch = 
      entry.service_name.toLowerCase().includes(search.toLowerCase()) ||
      entry.staff_profiles.display_name.toLowerCase().includes(search.toLowerCase()) ||
      (entry.client_name?.toLowerCase().includes(search.toLowerCase()) ?? false)
    
    const matchesStatus = statusFilter === 'all' || entry.status === statusFilter
    const matchesStaff = staffFilter === 'all' || entry.staff_profiles.id === staffFilter

    return matchesSearch && matchesStatus && matchesStaff
  })

  async function updateEntryStatus(entryId: string, newStatus: string) {
    setLoading(entryId)
    const supabase = createClient()
    
    const updateData: Record<string, unknown> = { status: newStatus }
    if (newStatus === 'approved') {
      updateData.approved_at = new Date().toISOString()
    } else if (newStatus === 'paid') {
      updateData.paid_at = new Date().toISOString()
    }

    const { error } = await supabase
      .from('entries')
      .update(updateData)
      .eq('id', entryId)
      .eq('business_id', businessId)

    if (!error) {
      setEntries(prev => prev.map(e => 
        e.id === entryId ? { ...e, status: newStatus } : e
      ))
    }

    setLoading(null)
    router.refresh()
  }

  const pendingCount = entries.filter(e => e.status === 'pending').length
  const approvedCount = entries.filter(e => e.status === 'approved').length
  const paidCount = entries.filter(e => e.status === 'paid').length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Entries</h1>
        <p className="text-muted-foreground">Manage and approve commission entries</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center">
              <span className="text-warning-foreground font-bold">{pendingCount}</span>
            </div>
            <div>
              <p className="text-sm font-medium">Pending</p>
              <p className="text-xs text-muted-foreground">Awaiting approval</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-primary font-bold">{approvedCount}</span>
            </div>
            <div>
              <p className="text-sm font-medium">Approved</p>
              <p className="text-xs text-muted-foreground">Ready to pay</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
              <span className="text-success font-bold">{paidCount}</span>
            </div>
            <div>
              <p className="text-sm font-medium">Paid</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">All Entries</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search entries..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Select value={staffFilter} onValueChange={setStaffFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Staff" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Staff</SelectItem>
                {staffProfiles.map(staff => (
                  <SelectItem key={staff.id} value={staff.id}>
                    {staff.display_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          {filteredEntries.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No entries found.</p>
              {entries.length === 0 && (
                <p className="text-sm mt-1">Entries will appear here once staff start logging services.</p>
              )}
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Service</TableHead>
                    <TableHead>Staff</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Commission</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{entry.service_name}</p>
                          {entry.client_name && (
                            <p className="text-xs text-muted-foreground">{entry.client_name}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{entry.staff_profiles.display_name}</TableCell>
                      <TableCell>{formatDate(entry.service_date)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(entry.gross_amount)}</TableCell>
                      <TableCell className="text-right">
                        <div>
                          <p>{formatCurrency(entry.commission_amount)}</p>
                          <p className="text-xs text-muted-foreground">{entry.commission_rate}%</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(entry.status)}>
                          {entry.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" disabled={loading === entry.id}>
                              {loading === entry.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <MoreHorizontal className="w-4 h-4" />
                              )}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {entry.status === 'pending' && (
                              <>
                                <DropdownMenuItem onClick={() => updateEntryStatus(entry.id, 'approved')}>
                                  <CheckCircle className="w-4 h-4 mr-2 text-primary" />
                                  Approve
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateEntryStatus(entry.id, 'rejected')}>
                                  <XCircle className="w-4 h-4 mr-2 text-destructive" />
                                  Reject
                                </DropdownMenuItem>
                              </>
                            )}
                            {entry.status === 'approved' && (
                              <DropdownMenuItem onClick={() => updateEntryStatus(entry.id, 'paid')}>
                                <DollarSign className="w-4 h-4 mr-2 text-success" />
                                Mark as Paid
                              </DropdownMenuItem>
                            )}
                            {entry.status === 'rejected' && (
                              <DropdownMenuItem onClick={() => updateEntryStatus(entry.id, 'pending')}>
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Reopen
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
