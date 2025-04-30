'use client'
import { AppSidebar } from '@/components/app-sidebar'
import { data } from '@/components/app-sidebar'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { Toaster } from '@/components/ui/sonner'
import { usePathname } from 'next/navigation'
import { useMemo } from 'react'
export const ConsoleLayout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname()
  const currentPath = pathname || '/'

  const breadcrumbData = useMemo(() => {
    let parentTitle = ''
    let currentTitle = ''
    for (const navGroup of data.navMain) {
      for (const item of navGroup.items || []) {
        if (currentPath !== '/' && item.url !== '/' && currentPath.indexOf(item.url) === 0) {
          parentTitle = navGroup.title
          currentTitle = item.title
          return { parentTitle, currentTitle, parentUrl: navGroup.url }
        }
      }

      if (navGroup.url === currentPath) {
        return { parentTitle: '', currentTitle: navGroup.title, parentUrl: '/' }
      }
    }

    return { parentTitle: '', currentTitle: 'Home', parentUrl: '/' }
  }, [currentPath])
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                {breadcrumbData.parentTitle && (
                  <>
                    <BreadcrumbItem className="hidden md:block">
                      <BreadcrumbLink href={breadcrumbData.parentUrl}>
                        {breadcrumbData.parentTitle}
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator className="hidden md:block" />
                  </>
                )}
                <BreadcrumbItem>
                  <BreadcrumbPage>{breadcrumbData.currentTitle}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div></div>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">{children}</div>
        <Toaster />
      </SidebarInset>
    </SidebarProvider>
  )
}
export default ConsoleLayout
