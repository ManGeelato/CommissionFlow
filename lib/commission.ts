import { CommissionType, TieredRate } from './types'

export function calculateCommission(
  grossAmount: number,
  commissionType: CommissionType,
  commissionRate: number,
  tieredRates?: TieredRate[]
): number {
  switch (commissionType) {
    case 'percentage':
      return Math.round((grossAmount * commissionRate / 100) * 100) / 100
    
    case 'flat':
      return Math.round(commissionRate * 100) / 100
    
    case 'tiered':
      return calculateTieredCommission(grossAmount, tieredRates || [])
    
    default:
      return 0
  }
}

function calculateTieredCommission(
  grossAmount: number,
  tieredRates: TieredRate[]
): number {
  // Sort tiers by min value
  const sortedTiers = [...tieredRates].sort((a, b) => a.min - b.min)
  
  // Find the applicable tier
  for (const tier of sortedTiers.reverse()) {
    if (grossAmount >= tier.min) {
      if (tier.max === null || grossAmount <= tier.max) {
        return Math.round((grossAmount * tier.rate / 100) * 100) / 100
      }
    }
  }
  
  // Default to first tier if no match
  if (sortedTiers.length > 0) {
    return Math.round((grossAmount * sortedTiers[0].rate / 100) * 100) / 100
  }
  
  return 0
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date))
}

export function formatShortDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(date))
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'pending':
      return 'bg-warning/10 text-warning-foreground border-warning/20'
    case 'approved':
      return 'bg-primary/10 text-primary border-primary/20'
    case 'paid':
      return 'bg-success/10 text-success border-success/20'
    case 'rejected':
      return 'bg-destructive/10 text-destructive border-destructive/20'
    default:
      return 'bg-muted text-muted-foreground'
  }
}

export function getStatusBadgeVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'approved':
    case 'paid':
      return 'default'
    case 'pending':
      return 'secondary'
    case 'rejected':
      return 'destructive'
    default:
      return 'outline'
  }
}
