'use client'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { LayoutDashboard, Settings } from 'lucide-react'
import { usePathname } from 'next/navigation'
import {
  Sidebar as UISidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenu,
} from '@/components/ui/sidebar'

interface NavItemProps {
  href: string
  label: string
  icon: React.ReactNode
}

function NavItem({ href, label, icon }: NavItemProps) {
  const pathname = usePathname()
  const active = pathname?.includes(href)
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild className={cn(active && 'bg-accent')}>
        <Link href={href} className="flex items-center gap-2">
          {icon}
          <span>{label}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

export function Sidebar() {
  return (
    <UISidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <NavItem
                href="/routes"
                label="仪表盘"
                icon={<LayoutDashboard className="h-4 w-4" />}
              />
              <NavItem href="/nezha" label="服务器监控" icon={<Settings className="h-4 w-4" />} />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </UISidebar>
  )
}
