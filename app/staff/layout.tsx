'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart3, FilePlus2, History, LogOut, Menu, Wallet, X } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

const navigation = [
  { href: '/staff', label: 'Overview', icon: BarChart3 },
  { href: '/staff/entries/new', label: 'Log service', icon: FilePlus2 },
  { href: '/staff/entries', label: 'My entries', icon: History },
]

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  async function signOut() {
    await createClient().auth.signOut()
    window.location.href = '/'
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur lg:hidden">
        <div className="flex h-16 items-center justify-between px-4">
          <Link href="/staff" className="flex items-center gap-2 font-semibold">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground"><Wallet className="size-4" /></span>
            CommissionFlow
          </Link>
          <Button variant="ghost" size="icon" onClick={() => setOpen(!open)} aria-label={open ? 'Close menu' : 'Open menu'}>
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>
      </header>

      <aside className={cn('fixed inset-y-0 left-0 z-40 w-64 border-r bg-slate-950 text-slate-100 transition-transform lg:translate-x-0', open ? 'translate-x-0' : '-translate-x-full')}>
        <div className="flex h-16 items-center border-b border-white/10 px-6">
          <Link href="/staff" className="flex items-center gap-2 font-semibold" onClick={() => setOpen(false)}>
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground"><Wallet className="size-4" /></span>
            CommissionFlow
          </Link>
        </div>
        <div className="flex h-[calc(100%-4rem)] flex-col p-4">
          <p className="mb-3 px-3 text-xs font-medium uppercase tracking-wider text-slate-400">Workspace</p>
          <nav className="space-y-1">
            {navigation.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || (href !== '/staff' && pathname.startsWith(href))
              return <Link key={href} href={href} onClick={() => setOpen(false)} className={cn('flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors', active ? 'bg-primary text-primary-foreground' : 'text-slate-300 hover:bg-white/10 hover:text-white')}><Icon className="size-4" />{label}</Link>
            })}
          </nav>
          <div className="mt-auto border-t border-white/10 pt-4">
            <Button variant="ghost" className="w-full justify-start gap-3 text-slate-300 hover:bg-white/10 hover:text-white" onClick={signOut}><LogOut className="size-4" />Sign out</Button>
          </div>
        </div>
      </aside>
      {open && <button className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setOpen(false)} aria-label="Close navigation" />}
      <main className="lg:pl-64"><div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">{children}</div></main>
    </div>
  )
}
