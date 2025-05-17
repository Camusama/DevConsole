import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format date to a readable string
export function formatDate(date: Date): string {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return 'Invalid date'
  }

  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  // If less than a minute ago
  if (seconds < 60) {
    return '刚刚'
  }
  // If less than an hour ago
  else if (minutes < 60) {
    return `${minutes}分钟前`
  }
  // If less than a day ago
  else if (hours < 24) {
    return `${hours}小时前`
  }
  // If less than a week ago
  else if (days < 7) {
    return `${days}天前`
  }
  // Otherwise, return the full date
  else {
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }
}
