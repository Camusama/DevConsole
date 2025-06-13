import type { ReactNode } from 'react'
import { ThemeProvider } from 'next-themes'
import { Toaster } from '@/components/ui/sonner'
import { ChatbotProvider } from './chatbot-provider'
import { EdgeSyncStateProvider } from '@/providers/edge-page-action'

interface AppProvidersProps {
  children: ReactNode
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <ChatbotProvider>
        <EdgeSyncStateProvider>{children}</EdgeSyncStateProvider>
        <Toaster />
      </ChatbotProvider>
    </ThemeProvider>
  )
}
