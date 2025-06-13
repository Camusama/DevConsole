import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Send, Square } from 'lucide-react'
import { useChatbotStore } from './store'
import { cn } from './utils'

interface ChatbotInputProps {
  onSuggestionClick?: (suggestion: string) => void
  className?: string
}

export function ChatbotInput({
  onSuggestionClick,
  className,
}: ChatbotInputProps) {
  const {
    inputText,
    setInputText,
    sendMessage,
    isLoading,
    isStreaming,
    abortCurrentMessage,
    config,
  } = useChatbotStore()

  const [localInputText, setLocalInputText] = useState('')

  const inputRef = useRef<HTMLInputElement>(null)

  // Sync with store input text (for external updates like initial prompt)
  useEffect(() => {
    if (inputText !== localInputText && !isLoading && !isStreaming) {
      setLocalInputText(inputText)
    }
  }, [inputText, localInputText, isLoading, isStreaming])

  // Focus input when component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus()
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const text = localInputText.trim()
    if (!text || isLoading) return

    // Clear input immediately
    setLocalInputText('')
    setInputText('')

    // Send message
    await sendMessage(text)

    // Refocus input
    setTimeout(() => {
      inputRef.current?.focus()
    }, 100)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setLocalInputText(value)
    setInputText(value)
  }

  const handleSuggestionClick = (suggestion: string) => {
    // Don't handle suggestion clicks if currently loading
    if (isLoading || isStreaming) return

    // Call the parent's suggestion handler directly
    // The parent will handle sending the message
    onSuggestionClick?.(suggestion)

    // Auto-focus input after suggestion click
    setTimeout(() => {
      inputRef.current?.focus()
    }, 0)
  }

  const handleAbort = () => {
    abortCurrentMessage()
  }

  const canSend = localInputText.trim().length > 0 && !isLoading
  const showAbort = isLoading || isStreaming

  return (
    <div className={cn('space-y-2', className)}>
      {/* Suggestion Tags */}
      {config.suggestionTags && config.suggestionTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {config.suggestionTags.map((suggestion, index) => (
            <Badge
              key={`${suggestion}-${index}`}
              variant="outline"
              className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors duration-200 text-xs px-2 py-0.5 h-6"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              {suggestion}
            </Badge>
          ))}
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <div className="relative flex-1">
          <Input
            ref={inputRef}
            value={localInputText}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={config.placeholder || 'Ask me anything...'}
            disabled={isLoading}
            className="pr-12 h-12 rounded-full border-2 focus:border-primary transition-colors"
          />

          {/* Send/Abort Button */}
          <div className="absolute right-1 top-1/2 -translate-y-1/2">
            {showAbort ? (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={handleAbort}
                className="h-10 w-10 rounded-full hover:bg-red-50 hover:text-red-600"
              >
                <Square className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                size="sm"
                disabled={!canSend}
                className="h-10 w-10 rounded-full"
              >
                <Send className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}
