// Database types for CommissionFlow

export type UserRole = 'admin' | 'staff'
export type EntryStatus = 'pending' | 'approved' | 'paid' | 'rejected'
export type CommissionType = 'percentage' | 'flat' | 'tiered'
export type StaffStatus = 'active' | 'inactive' | 'pending'

export interface Business {
  id: string
  name: string
  slug: string
  owner_id: string
  settings: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: UserRole
  created_at: string
  updated_at: string
}

export interface TieredRate {
  min: number
  max: number | null
  rate: number
}

export interface StaffProfile {
  id: string
  user_id: string
  business_id: string
  display_name: string
  commission_rate: number
  commission_type: CommissionType
  tiered_rates: TieredRate[]
  status: StaffStatus
  invited_at: string
  joined_at: string | null
  created_at: string
  updated_at: string
}

export interface Service {
  id: string
  business_id: string
  name: string
  description: string | null
  default_price: number
  category: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Entry {
  id: string
  business_id: string
  staff_id: string
  service_id: string | null
  service_name: string
  client_name: string | null
  service_date: string
  gross_amount: number
  commission_rate: number
  commission_type: CommissionType
  commission_amount: number
  notes: string | null
  status: EntryStatus
  approved_at: string | null
  approved_by: string | null
  paid_at: string | null
  created_at: string
  updated_at: string
}

export interface EntryAuditLog {
  id: string
  entry_id: string
  action: string
  old_status: string | null
  new_status: string | null
  changed_by: string
  changed_at: string
  notes: string | null
}

// Extended types with relations
export interface EntryWithStaff extends Entry {
  staff_profile: StaffProfile
}

export interface StaffProfileWithUser extends StaffProfile {
  profile?: Profile
}

// Dashboard stats types
export interface DashboardStats {
  totalRevenue: number
  totalCommissions: number
  pendingEntries: number
  approvedEntries: number
  paidEntries: number
  staffCount: number
}

export interface StaffDashboardStats {
  totalEarnings: number
  pendingEarnings: number
  approvedEarnings: number
  paidEarnings: number
  totalEntries: number
  thisMonthEarnings: number
}
