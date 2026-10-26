'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { 
  DollarSign, 
  LayoutDashboard, 
  Users, 
  FileText, 
  Settings,
  ClipboardList
} from 'lucide-react'

interface AdminSidebarProps {
  businessName: string
}

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/entries', label: 'Entries', icon: FileText },
  { href: '/admin/staff', label: 'Staff', icon: Users },
  { href: '/admin/services', label: 'Services', icon: ClipboardList },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
]

export function AdminSidebar({ businessName }: AdminSidebarProps) {
  const pathname = usePathname()

  return (
    <>
      {/* Mobile overlay handled by header */}
      <aside className="fixed inset-y-0 left-0 z-40 w-64 bg-sidebar border-r border-sidebar-border hidden lg:block">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center gap-2 px-4 border-b border-sidebar-border">
            <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-sidebar-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-sidebar-foreground text-sm">CommissionFlow</span>
              <span className="text-xs text-sidebar-foreground/60 truncate max-w-[160px]">{businessName}</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || 
                (item.href !== '/admin' && pathname.startsWith(item.href))
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-sidebar-border">
            <p className="text-xs text-sidebar-foreground/50">
              CommissionFlow v1.0
            </p>
          </div>
        </div>
      </aside>
    </>
  )
}
