import { useEffect, useRef } from 'react'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { X, RotateCcw, Maximize2, Minimize2 } from 'lucide-react'
import { useChatbotStore } from './store'
import { ChatbotMessage } from './chatbot-message'
import { ChatbotInput } from './chatbot-input'
import { scrollToBottom, cn } from './utils'

interface ChatbotDialogProps {
  className?: string
}

export function ChatbotDialog({ className }: ChatbotDialogProps) {
  const {
    isOpen,
    setIsOpen,
    messages,
    clearMessages,
    updateMessage,
    sendMessage,
    config,
    toggleSize,
  } = useChatbotStore()

  const messagesContainerRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (isOpen && messages.length > 0) {
      scrollToBottom(messagesContainerRef.current)
    }
  }, [messages, isOpen])

  // Auto-scroll when dialog opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        scrollToBottom(messagesContainerRef.current)
      }, 100)
    }
  }, [isOpen])

  const handleClose = () => {
    setIsOpen(false)
  }

  const handleClearMessages = () => {
    clearMessages()
  }

  const handleToggleSize = () => {
    toggleSize()
  }

  const handleSuggestionClick = async (suggestion: string) => {
    // Only send message if not currently loading/streaming
    const { isLoading, isStreaming } = useChatbotStore.getState()
    if (!isLoading && !isStreaming) {
      await sendMessage(suggestion)
    }
  }

  const handleLikeToggle = (messageId: string, liked: boolean) => {
    updateMessage(messageId, {
      liked: liked,
    })
  }

  const getPositionClasses = () => {
    switch (config.position) {
      case 'bottom-left':
        return 'bottom-24 left-6'
      case 'top-right':
        return 'top-24 right-6'
      case 'top-left':
        return 'top-24 left-6'
      case 'bottom-right':
      default:
        return 'bottom-24 right-6'
    }
  }

  if (!isOpen) return null

  const getSizeClasses = () => {
    if (config.size === 'expanded') {
      return 'w-[600px] h-[800px]'
    } else {
      return 'w-[480px] h-[520px]'
    }
  }

  return (
    <div className={cn('fixed z-40', getPositionClasses(), className)}>
      <Card
        className={cn(
          'shadow-2xl border-2 flex flex-col animate-in slide-in-from-bottom-4 duration-300 transition-all',
          getSizeClasses(),
        )}
      >
        {/* Header */}
        <CardHeader className="flex-shrink-0 pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">
              {config.title || 'AI Assistant'}
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleToggleSize}
                className="h-8 w-8 p-0 hover:bg-muted"
                title={config.size === 'expanded' ? 'Minimize' : 'Expand'}
              >
                {config.size === 'expanded' ? (
                  <Minimize2 className="w-4 h-4" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
              </Button>
              {messages.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearMessages}
                  className="h-8 w-8 p-0 hover:bg-muted"
                  title="Clear conversation"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="h-8 w-8 p-0 hover:bg-muted"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <Separator />
        </CardHeader>

        {/* Messages */}
        <CardContent className="flex-1 overflow-hidden p-0">
          <div
            ref={messagesContainerRef}
            className="h-full overflow-y-auto px-6 py-4 space-y-6 scroll-smooth"
          >
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                  <span className="text-2xl">🤖</span>
                </div>
                <div className="space-y-2">
                  <h3 className="font-medium text-foreground">
                    Welcome to {config.title || 'AI Assistant'}!
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-xs">
                    I'm here to help you with any questions you might have. Feel
                    free to ask me anything!
                  </p>
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <ChatbotMessage
                  key={message.id}
                  message={message}
                  onSuggestionClick={handleSuggestionClick}
                  onLikeToggle={handleLikeToggle}
                />
              ))
            )}
          </div>
        </CardContent>

        {/* Input */}
        <CardFooter className="flex-shrink-0 pt-3">
          <ChatbotInput
            onSuggestionClick={handleSuggestionClick}
            className="w-full"
          />
        </CardFooter>
      </Card>
    </div>
  )
}
