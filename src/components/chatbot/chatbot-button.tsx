'use client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MessageCircle, X } from 'lucide-react'
import { useChatbotStore } from './store'
import { cn } from './utils'

interface ChatbotButtonProps {
  className?: string
}

export function ChatbotButton({ className }: ChatbotButtonProps) {
  const { isOpen, setIsOpen, config } = useChatbotStore()

  // Count unread messages (for future use)
  const unreadCount = 0 // This could be implemented later

  const handleToggle = () => {
    setIsOpen(!isOpen)
  }

  const getPositionClasses = () => {
    switch (config.position) {
      case 'bottom-left':
        return 'bottom-6 left-6'
      case 'top-right':
        return 'top-6 right-6'
      case 'top-left':
        return 'top-6 left-6'
      case 'bottom-right':
      default:
        return 'bottom-6 right-6'
    }
  }

  return (
    <div className={cn('fixed z-50', getPositionClasses(), className)}>
      <div className="relative">
        {/* Unread Badge */}
        {unreadCount > 0 && !isOpen && (
          <Badge
            variant="destructive"
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center text-xs font-bold z-10"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}

        {/* Main Button */}
        <Button
          onClick={handleToggle}
          size="lg"
          className={cn(
            'h-14 w-14 rounded-full  transition-all duration-200 ease-in-out',
            'bg-primary hover:bg-primary/90 text-primary-foreground',
            'border-2 border-background',
            isOpen && 'rotate-180'
          )}
        >
          {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
        </Button>

        {/* Pulse Animation for New Messages */}
        {unreadCount > 0 && !isOpen && (
          <div className="absolute inset-0 rounded-full bg-primary animate-ping opacity-20" />
        )}
      </div>
    </div>
  )
}
