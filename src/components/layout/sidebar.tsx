'use client'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { LayoutDashboard, Settings } from 'lucide-react'
import { usePathname } from 'next/navigation'

interface NavItemProps {
  href: string
  label: string
  icon: React.ReactNode
}

function NavItem({ href, label, icon }: NavItemProps) {
  const pathname = usePathname()
  const active = pathname?.includes(href)
  return (
    <Link href={href}>
      <Button variant="ghost" className={cn('w-full justify-start gap-2', active && 'bg-accent')}>
        {icon}
        {label}
      </Button>
    </Link>
  )
}

export function Sidebar() {
  return (
    <div className="w-60 border-r bg-background p-3 space-y-4">
      <div className="space-y-1">
        <NavItem href="/routes" label="仪表盘" icon={<LayoutDashboard className="h-4 w-4" />} />
        <NavItem href="/nezha" label="服务器监控" icon={<Settings className="h-4 w-4" />} />
      </div>
    </div>
  )
}
