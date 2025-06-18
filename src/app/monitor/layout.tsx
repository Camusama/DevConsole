'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'


const MONITOR_ROUTES = [
  '/monitor/esxi',
  '/monitor/S3-storage',
  '/monitor/deploy'
]

export default function MonitorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    // Prefetch all monitor routes except the current one
    MONITOR_ROUTES.forEach(route => {
      if (pathname !== route) {
        router.prefetch(route)
      }
    })
  }, [pathname, router])

  return <>{children}</>
} 