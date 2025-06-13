'use client'

import { usePathname } from 'next/navigation'
import { Chatbot } from '@/components/chatbot'

interface ChatbotProviderProps {
  children: React.ReactNode
}

export function ChatbotProvider({ children }: ChatbotProviderProps) {
  const pathname = usePathname()
  
  // Check if current route should show chatbot (only auth routes)
  // Based on middleware.ts: isAuthRoute matches '/monitor(.*)' and '/api(.*)'
  const shouldShowChatbot = pathname.startsWith('/monitor') || pathname.startsWith('/api')

  return (
    <>
      {children}
      {shouldShowChatbot && (
        <Chatbot 
          config={{
            title: 'DevConsole AI Assistant',
            placeholder: 'Ask me about your infrastructure...',
            position: 'bottom-right',
            theme: 'auto',
            size: 'expanded',
          }}
        />
      )}
    </>
  )
}
