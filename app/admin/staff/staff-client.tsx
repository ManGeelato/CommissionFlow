'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { formatCurrency } from '@/lib/commission'
import { UserPlus, Loader2, Users, DollarSign, TrendingUp } from 'lucide-react'

interface StaffProfile {
  id: string
  user_id: string
  display_name: string
  commission_rate: number
  commission_type: string
  status: string
  created_at: string
  totalEntries: number
  totalRevenue: number
  totalCommissions: number
  pendingCommissions: number
}

interface StaffClientProps {
  staffProfiles: StaffProfile[]
  businessId: string
}

export function StaffClient({ staffProfiles: initialStaff, businessId }: StaffClientProps) {
  const router = useRouter()
  const [staffProfiles, setStaffProfiles] = useState(initialStaff)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state for new staff
  const [newStaffEmail, setNewStaffEmail] = useState('')
  const [newStaffName, setNewStaffName] = useState('')
  const [newStaffRate, setNewStaffRate] = useState('50')
  const [newStaffType, setNewStaffType] = useState('percentage')
  
  async function handleAddStaff(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      const { data, error: addError } = await supabase.rpc(
        'add_staff_by_email',
        {
          p_business_id: businessId,
          p_email: newStaffEmail.trim(),
          p_display_name: newStaffName.trim(),
          p_commission_rate: parseFloat(newStaffRate),
          p_commission_type: newStaffType,
        }
      )

      if (addError) {
        setError(addError.message)
        return
      }

      if (!data) {
        setError('Staff member could not be added.')
        return
      }

      setStaffProfiles(prev => [
        {
          ...data,
          totalEntries: 0,
          totalRevenue: 0,
          totalCommissions: 0,
          pendingCommissions: 0,
        },
        ...prev,
      ])

      setDialogOpen(false)
      setNewStaffEmail('')
      setNewStaffName('')
      setNewStaffRate('50')
      setNewStaffType('percentage')

      router.refresh()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred while adding staff.'
      )
    } finally {
      setLoading(false)
    }
  }


  async function updateStaffStatus(staffId: string, newStatus: string) {
    const supabase = createClient()
    await supabase
      .from('staff_profiles')
      .update({ status: newStatus })
      .eq('id', staffId)
      .eq('business_id', businessId)

    setStaffProfiles(prev => prev.map(s => 
      s.id === staffId ? { ...s, status: newStatus } : s
    ))
    router.refresh()
  }

  const activeStaff = staffProfiles.filter(s => s.status === 'active')
  const totalTeamRevenue = staffProfiles.reduce((sum, s) => sum + s.totalRevenue, 0)
  const totalTeamCommissions = staffProfiles.reduce((sum, s) => sum + s.totalCommissions, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Staff</h1>
          <p className="text-muted-foreground">Manage your team members and commission rates</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <UserPlus className="w-4 h-4" />
              Add Staff
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Staff Member</DialogTitle>
              <DialogDescription>
                Add a team member to your business. They must have a CommissionFlow account first.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddStaff}>
              <FieldGroup className="py-4">
                <Field>
                  <FieldLabel htmlFor="staffEmail">Email Address</FieldLabel>
                  <Input
                    id="staffEmail"
                    type="email"
                    placeholder="staff@example.com"
                    value={newStaffEmail}
                    onChange={(e) => setNewStaffEmail(e.target.value)}
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="staffName">Display Name</FieldLabel>
                  <Input
                    id="staffName"
                    type="text"
                    placeholder="Jane Smith"
                    value={newStaffName}
                    onChange={(e) => setNewStaffName(e.target.value)}
                    required
                  />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="commissionRate">Commission Rate</FieldLabel>
                    <Input
                      id="commissionRate"
                      type="number"
                      min="0"
                      max="100"
                      step="0.5"
                      value={newStaffRate}
                      onChange={(e) => setNewStaffRate(e.target.value)}
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="commissionType">Type</FieldLabel>
                    <Select value={newStaffType} onValueChange={setNewStaffType}>
                      <SelectTrigger id="commissionType">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage</SelectItem>
                        <SelectItem value="flat">Flat Rate</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
              </FieldGroup>

              {error && (
                <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm mb-4">
                  {error}
                </div>
              )}

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    'Add Staff'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{activeStaff.length}</p>
              <p className="text-sm text-muted-foreground">Active staff</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">{formatCurrency(totalTeamRevenue)}</p>
              <p className="text-sm text-muted-foreground">Team revenue</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-chart-2/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-chart-2" />
            </div>
            <div>
              <p className="text-2xl font-bold">{formatCurrency(totalTeamCommissions)}</p>
              <p className="text-sm text-muted-foreground">Total commissions</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Staff List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Team Members</CardTitle>
          <CardDescription>View and manage your staff&apos;s commission rates and performance</CardDescription>
        </CardHeader>
        <CardContent>
          {staffProfiles.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">No staff members yet</p>
              <p className="text-sm mt-1">Add your first team member to get started.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {staffProfiles.map((staff) => (
                <div
                  key={staff.id}
                  className="flex items-center gap-4 p-4 rounded-lg border border-border"
                >
                  <Avatar className="w-12 h-12">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {staff.display_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{staff.display_name}</p>
                      <Badge variant={staff.status === 'active' ? 'default' : 'secondary'}>
                        {staff.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {staff.commission_rate}% {staff.commission_type} commission
                    </p>
                  </div>
                  <div className="hidden md:block text-right">
                    <p className="font-medium">{formatCurrency(staff.totalRevenue)}</p>
                    <p className="text-xs text-muted-foreground">Revenue</p>
                  </div>
                  <div className="hidden md:block text-right">
                    <p className="font-medium">{formatCurrency(staff.totalCommissions)}</p>
                    <p className="text-xs text-muted-foreground">Commissions</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{staff.totalEntries}</p>
                    <p className="text-xs text-muted-foreground">Entries</p>
                  </div>
                  <Select
                    value={staff.status}
                    onValueChange={(value) => updateStaffStatus(staff.id, value)}
                  >
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
