import { useEffect } from 'react'
import { ChatbotButton } from './chatbot-button'
import { ChatbotDialog } from './chatbot-dialog'
import { useChatbotStore } from './store'
import { useRoutePrompts } from './hooks'
import type { ChatbotConfig } from './types'

interface ChatbotProps {
  config?: Partial<ChatbotConfig>
  className?: string
}

export function Chatbot({ config, className }: ChatbotProps) {
  const { setConfig, setInputText } = useChatbotStore()

  // Enable route-based prompt updates
  useRoutePrompts()

  // Update config when props change (manual config overrides route-based config)
  useEffect(() => {
    if (config) {
      setConfig(config)

      // Set initial prompt if provided
      if (config.initialPrompt) {
        setInputText(config.initialPrompt)
      }
    }
  }, [config, setConfig, setInputText])

  return (
    <>
      <ChatbotButton className={className} />
      <ChatbotDialog className={className} />
    </>
  )
}

// Export all components and types for external use
export { ChatbotButton } from './chatbot-button'
export { ChatbotDialog } from './chatbot-dialog'
export { ChatbotMessage } from './chatbot-message'
export { ChatbotInput } from './chatbot-input'
export { useChatbotStore } from './store'
export { useRoutePrompts } from './hooks'
export * from './prompts'
export type { ChatbotConfig, ChatMessage, ChatbotStore } from './types'

// Default export
export default Chatbot
