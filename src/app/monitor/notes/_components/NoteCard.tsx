'use client'

import { useState } from 'react'
import { Edit, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Note } from '@/lib/notionClient'

interface NoteCardProps {
  note: Note
  onEdit: (note: Note) => void
  onDelete: (id: string) => void
}

export default function NoteCard({ note, onEdit, onDelete }: NoteCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  // Format date to a readable string
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <Card
      className="h-full flex flex-col transition-shadow hover:shadow-md cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 使卡片主体可点击 */}
      <div className="flex-grow" onClick={() => onEdit(note)}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium line-clamp-1">{note.title}</CardTitle>
        </CardHeader>
        <CardContent className="pb-2">
          <p className="text-sm text-muted-foreground line-clamp-3">{note.content}</p>
        </CardContent>
      </div>
      <CardFooter className="pt-2 flex justify-between items-center text-xs text-muted-foreground">
        <span>{formatDate(note.updatedAt)}</span>
        <div className={`flex gap-2 transition-opacity ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={e => {
                    e.stopPropagation() // 防止触发卡片的点击事件
                    onEdit(note)
                  }}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>编辑笔记</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={e => {
                    e.stopPropagation() // 防止触发卡片的点击事件
                    onDelete(note.id)
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>删除笔记</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardFooter>
    </Card>
  )
}
