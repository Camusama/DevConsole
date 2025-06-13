'use client'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ThumbsUp, ThumbsDown, User, Bot } from 'lucide-react'
import type { ChatMessage } from './types'
import { formatTime, cn } from './utils'
import { MarkdownRenderer } from './markdown-renderer'

interface ChatbotMessageProps {
  message: ChatMessage
  onSuggestionClick?: (suggestion: string) => void
  onLikeToggle?: (messageId: string, liked: boolean) => void
}

export function ChatbotMessage({ message, onSuggestionClick, onLikeToggle }: ChatbotMessageProps) {
  const isLoading = message.loading
  const hasAnswer = !!message.answer

  return (
    <div className="space-y-4">
      {/* User Message */}
      {message.question && (
        <div className="flex justify-end">
          <div className="flex items-start gap-3 max-w-[85%]">
            <div className="flex flex-col items-end gap-1">
              {message.questionTimestamp && (
                <span className="text-xs text-muted-foreground">
                  {formatTime(message.questionTimestamp)}
                </span>
              )}
              <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-md px-4 py-2 max-w-full break-words">
                <p className="text-sm leading-relaxed">{message.question}</p>
              </div>
            </div>
            <Avatar className="w-8 h-8 flex-shrink-0">
              <AvatarFallback className="bg-primary/10">
                <User className="w-4 h-4" />
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      )}

      {/* AI Response */}
      {(hasAnswer || isLoading) && (
        <div className="flex justify-start">
          <div className="flex items-start gap-3 max-w-[85%]">
            <Avatar className="w-8 h-8 flex-shrink-0">
              <AvatarFallback className="bg-muted">
                <Bot className="w-4 h-4" />
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-2 min-w-0 flex-1">
              {message.answerTimestamp && (
                <span className="text-xs text-muted-foreground">
                  {formatTime(message.answerTimestamp)}
                </span>
              )}

              {/* Loading State */}
              {isLoading && (
                <div className="bg-muted rounded-2xl rounded-tl-md px-4 py-3 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              )}

              {/* Answer Content */}
              {hasAnswer && !isLoading && (
                <div className="bg-muted rounded-2xl rounded-tl-md px-4 py-3">
                  <MarkdownRenderer content={message.answer!} className="text-sm leading-relaxed" />
                </div>
              )}

              {/* Action Buttons */}
              {hasAnswer && !isLoading && onLikeToggle && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      'h-8 px-2',
                      message.liked === true && 'text-green-600 bg-green-50'
                    )}
                    onClick={() => onLikeToggle(message.id, true)}
                  >
                    <ThumbsUp className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn('h-8 px-2', message.liked === false && 'text-red-600 bg-red-50')}
                    onClick={() => onLikeToggle(message.id, false)}
                  >
                    <ThumbsDown className="w-3 h-3" />
                  </Button>
                </div>
              )}

              {/* Suggestion Tags */}
              {message.suggestionTags &&
                message.suggestionTags.length > 0 &&
                hasAnswer &&
                !isLoading && (
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {message.suggestionTags.map((suggestion, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors text-xs px-2 py-0.5 h-6"
                        onClick={() => onSuggestionClick?.(suggestion)}
                      >
                        {suggestion}
                      </Badge>
                    ))}
                  </div>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
