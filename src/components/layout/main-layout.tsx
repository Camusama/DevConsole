import { ReactNode } from 'react'
import { Navbar } from './navbar'
import { Sidebar } from './sidebar'
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'

interface MainLayoutProps {
  children: ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex h-[calc(100vh-4rem)]">
        <SidebarProvider>
          <Sidebar />
          <main className="relative flex-1 overflow-y-auto p-6">
            <SidebarTrigger></SidebarTrigger>
            {children}
          </main>
        </SidebarProvider>
      </div>
    </div>
  )
}
