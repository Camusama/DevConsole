export interface ChatMessage {
  id: string
  question?: string
  answer?: string
  questionTimestamp?: Date
  answerTimestamp?: Date
  liked?: boolean
  loading?: boolean
  suggestionTags?: string[]
  isStreaming?: boolean
}

export interface ChatbotConfig {
  title?: string
  placeholder?: string
  initialPrompt?: string
  suggestionTags?: string[]
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  theme?: 'light' | 'dark' | 'auto'
  size?: 'compact' | 'expanded'
}

export interface ChatbotStore {
  // State
  isOpen: boolean
  isLoading: boolean
  isStreaming: boolean
  messages: ChatMessage[]
  inputText: string
  config: ChatbotConfig
  conversationId: string | null
  chatbotId: string | null

  // Actions
  setIsOpen: (isOpen: boolean) => void
  setIsLoading: (isLoading: boolean) => void
  setIsStreaming: (isStreaming: boolean) => void
  setInputText: (text: string) => void
  setConfig: (config: Partial<ChatbotConfig>) => void
  toggleSize: () => void
  addMessage: (message: Omit<ChatMessage, 'id'>) => void
  updateMessage: (id: string, updates: Partial<ChatMessage>) => void
  clearMessages: () => void
  sendMessage: (text: string) => Promise<void>
  abortCurrentMessage: () => void
  generateChatbotId: () => string
  resetChatbotId: () => string
}

export interface StreamCallbacks {
  onChunk: (chunk: string) => void
  onComplete: (message: ChatMessage) => void
  onError: (error: any) => void
}
