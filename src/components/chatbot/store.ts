import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type { ChatbotStore, ChatMessage, ChatbotConfig } from './types'
import { generateId } from './utils'
import { determineResponse, getRandomDelay, defaultSuggestionTags } from './mock'
import { OpenAIService } from './services/openai'
import { DifyService } from './services/dify'

const defaultConfig: ChatbotConfig = {
  title: 'AI Assistant',
  placeholder: 'Ask me anything...',
  initialPrompt: '',
  suggestionTags: defaultSuggestionTags,
  position: 'bottom-right',
  theme: 'auto',
  size: 'expanded',
}

let abortController: AbortController | null = null
let isProcessing = false

// Generate a unique chatbot ID for this session
const generateChatbotId = (): string => {
  return `chatbot_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
}

// localStorage key for chatbot ID persistence
const CHATBOT_ID_STORAGE_KEY = 'opencas_chatbot_id'

// Get or create persistent chatbot ID
const getPersistentChatbotId = (): string => {
  try {
    // Try to get existing ID from localStorage
    const existingId = localStorage.getItem(CHATBOT_ID_STORAGE_KEY)
    if (existingId) {
      return existingId
    }
  } catch {
    // localStorage might not be available (SSR, private browsing, etc.)
    // Silently ignore localStorage errors
  }

  // Generate new ID if none exists
  const newId = generateChatbotId()

  try {
    // Save to localStorage for future sessions
    localStorage.setItem(CHATBOT_ID_STORAGE_KEY, newId)
  } catch {
    // Ignore localStorage errors
  }

  return newId
}

// Generate initial chatbot ID (persistent)
const initialChatbotId = getPersistentChatbotId()

export const useChatbotStore = create<ChatbotStore>()(
  subscribeWithSelector((set, get) => ({
    // State
    isOpen: false,
    isLoading: false,
    isStreaming: false,
    messages: [],
    inputText: '',
    config: defaultConfig,
    conversationId: null,
    chatbotId: initialChatbotId,

    // Actions
    setIsOpen: isOpen => {
      set({ isOpen })
    },

    setIsLoading: isLoading => set({ isLoading }),

    setIsStreaming: isStreaming => set({ isStreaming }),

    setInputText: inputText => set({ inputText }),

    setConfig: newConfig =>
      set(state => ({
        config: { ...state.config, ...newConfig },
      })),

    toggleSize: () =>
      set(state => ({
        config: {
          ...state.config,
          size: state.config.size === 'expanded' ? 'compact' : 'expanded',
        },
      })),

    addMessage: message =>
      set(state => ({
        messages: [...state.messages, { ...message, id: generateId() }],
      })),

    updateMessage: (id, updates) =>
      set(state => ({
        messages: state.messages.map(msg => (msg.id === id ? { ...msg, ...updates } : msg)),
      })),

    clearMessages: () => set({ messages: [], conversationId: null }),

    generateChatbotId: () => {
      const newChatbotId = generateChatbotId()

      try {
        // Save new ID to localStorage
        localStorage.setItem(CHATBOT_ID_STORAGE_KEY, newChatbotId)
      } catch {
        // Ignore localStorage errors
      }

      set({ chatbotId: newChatbotId })
      return newChatbotId
    },

    // Reset chatbot ID (clear localStorage and generate new one)
    resetChatbotId: () => {
      try {
        localStorage.removeItem(CHATBOT_ID_STORAGE_KEY)
      } catch {
        // Ignore localStorage errors
      }

      const newChatbotId = getPersistentChatbotId()
      set({ chatbotId: newChatbotId })
      return newChatbotId
    },

    abortCurrentMessage: () => {
      if (abortController) {
        abortController.abort()
        abortController = null

        // Immediately set loading states to false
        set({ isLoading: false, isStreaming: false })

        // Reset processing flag
        isProcessing = false

        // Remove the last loading message if it exists
        const { messages, updateMessage } = get()
        const lastMessage = messages[messages.length - 1]
        if (lastMessage && lastMessage.loading) {
          updateMessage(lastMessage.id, {
            loading: false,
            answer: 'Request was cancelled.',
            isStreaming: false,
          })
        }
      }
    },

    sendMessage: async (text: string) => {
      const {
        addMessage,
        updateMessage,
        setIsLoading,
        setIsStreaming,
        messages,
        isLoading,
        isStreaming,
      } = get()

      // Prevent sending if already loading/streaming or processing
      if (isLoading || isStreaming || isProcessing) {
        return
      }

      // Set processing flag to prevent duplicate calls
      isProcessing = true

      // Abort any ongoing request
      if (abortController) {
        abortController.abort()
      }

      abortController = new AbortController()

      try {
        // Set loading state first to prevent duplicate calls
        setIsLoading(true)

        // Add user message
        const userMessage: Omit<ChatMessage, 'id'> = {
          question: text,
          questionTimestamp: new Date(),
        }
        addMessage(userMessage)

        // Add loading message for AI response
        const loadingMessage: Omit<ChatMessage, 'id'> = {
          loading: true,
          answerTimestamp: new Date(),
        }
        addMessage(loadingMessage)

        let response: string
        let newConversationId: string | null = null
        let followUpSuggestions: string[] | undefined

        const aiService = process.env.NEXT_PUBLIC_AI_SERVICE || 'mock'

        if (aiService === 'mock') {
          // Use mock data
          const delay = getRandomDelay()
          await new Promise(resolve => setTimeout(resolve, delay))

          // Check if request was aborted
          if (abortController?.signal.aborted) {
            return
          }

          response = determineResponse(text)
          followUpSuggestions = defaultSuggestionTags.slice(0, 3)
        } else if (aiService === 'dify') {
          // Use Dify API
          try {
            const difyService = new DifyService()
            const { conversationId: currentConversationId, chatbotId } = get()

            // Prepare inputs with chatbot_id
            const inputs = chatbotId ? { chatbot_id: chatbotId } : {}

            // Check if streaming is enabled
            setIsStreaming(true)
            response = ''

            const currentMessages = get().messages
            const loadingMessageId = currentMessages[currentMessages.length - 1]?.id

            for await (const chunk of difyService.sendMessageStream(
              text,
              currentConversationId || undefined,
              inputs,
              abortController?.signal
            )) {
              if (abortController?.signal.aborted) {
                return
              }

              if (chunk.content) {
                response += chunk.content

                // Update message with partial response
                if (loadingMessageId) {
                  updateMessage(loadingMessageId, {
                    loading: false,
                    answer: response,
                    isStreaming: true,
                  })
                }
              }

              if (chunk.isComplete) {
                newConversationId = chunk.conversationId || null
                followUpSuggestions = chunk.followUps
                break
              }
            }
          } catch (difyError) {
            // Check if the error is due to abort
            if (difyError instanceof Error && difyError.name === 'AbortError') {
              return // Request was aborted, exit silently
            }
            console.error('Dify API Error:', difyError)
            response =
              'Sorry, I encountered an error connecting to the AI service. Please try again.'
          }
        } else {
          // Use OpenAI API
          try {
            const openAIService = new OpenAIService()
            const { chatbotId } = get()

            // Convert chat history to OpenAI format (exclude the current loading message)
            const chatHistory = messages.slice(0, -1).filter(msg => !msg.loading)
            const openAIHistory = OpenAIService.convertChatHistoryToOpenAI(chatHistory)

            // Add chatbot_id context to the conversation if available
            const contextualText = chatbotId ? `[Chatbot Session ID: ${chatbotId}] ${text}` : text

            // Check if streaming is enabled
            if (process.env.NEXT_PUBLIC_OPENAI_STREAM) {
              // Use streaming response
              setIsStreaming(true)
              response = ''

              const currentMessages = get().messages
              const loadingMessageId = currentMessages[currentMessages.length - 1]?.id

              for await (const chunk of openAIService.sendMessageStream(
                contextualText,
                openAIHistory,
                {},
                abortController?.signal
              )) {
                if (abortController?.signal.aborted) {
                  return
                }

                response += chunk

                // Update message with partial response
                if (loadingMessageId) {
                  updateMessage(loadingMessageId, {
                    loading: false,
                    answer: response,
                    isStreaming: true,
                  })
                }
              }
            } else {
              // Use regular response
              response = await openAIService.sendMessage(contextualText, openAIHistory)
            }

            // Generate follow-up suggestions after getting the response
            if (response && !abortController?.signal.aborted) {
              followUpSuggestions = await openAIService.generateFollowUpSuggestions(
                contextualText,
                response
              )
            }
          } catch (openAIError) {
            // Check if the error is due to abort
            if (openAIError instanceof Error && openAIError.name === 'AbortError') {
              return // Request was aborted, exit silently
            }
            console.error('OpenAI API Error:', openAIError)
            response =
              'Sorry, I encountered an error connecting to the AI service. Please try again.'
          }
        }

        // Check if request was aborted
        if (abortController?.signal.aborted) {
          return
        }

        // Update the loading message with the final response
        const finalMessages = get().messages
        const loadingMessageId = finalMessages[finalMessages.length - 1]?.id

        if (loadingMessageId) {
          updateMessage(loadingMessageId, {
            loading: false,
            answer: response,
            isStreaming: false,
            suggestionTags: followUpSuggestions,
          })
        }

        // Update conversation ID if we got a new one (for Dify)
        if (newConversationId) {
          set({ conversationId: newConversationId })
        }
      } catch (error) {
        // Check if the error is due to abort
        if (error instanceof Error && error.name === 'AbortError') {
          return // Request was aborted, exit silently
        }

        console.error('Error sending message:', error)

        // Update loading message with error
        const errorMessages = get().messages
        const loadingMessageId = errorMessages[errorMessages.length - 1]?.id

        if (loadingMessageId) {
          updateMessage(loadingMessageId, {
            loading: false,
            answer: 'Sorry, I encountered an error. Please try again.',
            isStreaming: false,
          })
        }
      } finally {
        setIsLoading(false)
        setIsStreaming(false)
        abortController = null
        isProcessing = false // 重置处理锁
      }
    },
  }))
)
