import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatShortDate, getStatusBadgeVariant } from '@/lib/commission'

interface EntryWithStaff {
  id: string
  service_name: string
  gross_amount: number
  commission_amount: number
  service_date: string
  status: string
  staff_profiles: {
    display_name: string
  }
}

interface RecentEntriesTableProps {
  entries: EntryWithStaff[]
}

export function RecentEntriesTable({ entries }: RecentEntriesTableProps) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No entries yet.</p>
        <p className="text-sm">Entries will appear here once staff start logging services.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {entries.slice(0, 5).map((entry) => (
        <Link
          key={entry.id}
          href={`/admin/entries?id=${entry.id}`}
          className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-medium text-sm truncate">{entry.service_name}</p>
              <Badge variant={getStatusBadgeVariant(entry.status)} className="text-xs">
                {entry.status}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {entry.staff_profiles.display_name} • {formatShortDate(entry.service_date)}
            </p>
          </div>
          <div className="text-right ml-4">
            <p className="font-medium text-sm">{formatCurrency(entry.gross_amount)}</p>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(entry.commission_amount)} commission
            </p>
          </div>
        </Link>
      ))}
      {entries.length > 5 && (
        <Link
          href="/admin/entries"
          className="block text-center text-sm text-primary hover:underline py-2"
        >
          View all {entries.length} entries
        </Link>
      )}
    </div>
  )
}
