'use client'

import { useState } from 'react'
import { Edit, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

// Generic bookmark type
export type Bookmark = {
  _id?: string
  title: string
  url: string
  category: string
  description: string
  createdAt?: Date
  updatedAt?: Date
}

// Bookmark card props
type BookmarkCardProps = {
  bookmark: Bookmark
  editBookmark: (bookmark: Bookmark) => void
  deleteBookmark: (id: string) => void
  isCompact?: boolean
}

// Bookmark actions props
type BookmarkActionsProps = {
  bookmark: Bookmark
  editBookmark: (bookmark: Bookmark) => void
  deleteBookmark: (id: string) => void
  isCompact?: boolean
}

// Bookmark icon props
type BookmarkIconProps = {
  title: string
  isCompact?: boolean
}

// Bookmark icon component
export const BookmarkIcon = ({ title, isCompact = false }: BookmarkIconProps) => {
  const size = isCompact ? 'w-6 h-6' : 'w-8 h-8'
  const textSize = isCompact ? 'text-xs' : ''

  return (
    <div
      className={`${size} rounded bg-muted flex items-center justify-center text-muted-foreground ${textSize} font-medium`}
    >
      {title.charAt(0).toUpperCase()}
    </div>
  )
}

// Bookmark actions component
export const BookmarkActions = ({
  bookmark,
  editBookmark,
  deleteBookmark,
  isCompact = false,
}: BookmarkActionsProps) => {
  const iconSize = isCompact ? 'h-4 w-4' : 'h-3 w-3'
  const buttonSize = isCompact ? '' : 'h-7 w-7'
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const handleDelete = () => {
    if (bookmark._id) {
      deleteBookmark(bookmark._id)
      setShowDeleteDialog(false)
    }
  }

  return (
    <>
      <div className="flex gap-1">
        <Button
          variant="ghost"
          size="icon"
          className={buttonSize}
          onClick={e => {
            e.preventDefault()
            e.stopPropagation()
            editBookmark(bookmark)
          }}
        >
          <Edit className={iconSize} />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className={buttonSize}
          onClick={e => {
            e.preventDefault()
            e.stopPropagation()
            setShowDeleteDialog(true)
          }}
        >
          <Trash2 className={iconSize} />
        </Button>
      </div>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              您确定要删除书签 "{bookmark.title}" 吗？此操作无法撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-between sm:justify-between">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

// Bookmark card component
const BookmarkCard = ({
  bookmark,
  editBookmark,
  deleteBookmark,
  isCompact = false,
}: BookmarkCardProps) => {
  if (isCompact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              key={bookmark._id}
              className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 group transition-all duration-200 transform hover:scale-[1.02]"
            >
              <div className="flex items-center gap-3 flex-1">
                <BookmarkIcon title={bookmark.title} isCompact={true} />
                <div>
                  <div className="font-medium">{bookmark.title}</div>
                  {bookmark.description && (
                    <p className="text-sm text-muted-foreground truncate max-w-[200px]">{bookmark.description}</p>
                  )}
                </div>
              </div>
              <BookmarkActions
                bookmark={bookmark}
                editBookmark={editBookmark}
                deleteBookmark={deleteBookmark}
                isCompact={true}
              />
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p className="font-mono text-xs">{bookmark.url}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="group relative flex flex-col p-4 bg-card text-card-foreground rounded-lg border shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden transform hover:scale-[1.02] hover:border-primary/20">
            <div className="flex items-center gap-3 mb-2">
              <BookmarkIcon title={bookmark.title} />
              <div className="font-medium truncate">{bookmark.title}</div>
            </div>
            {bookmark.description && (
              <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{bookmark.description}</p>
            )}
            <div className="text-xs text-muted-foreground mt-auto pt-2 border-t flex justify-end items-center">
              <BookmarkActions
                bookmark={bookmark}
                editBookmark={editBookmark}
                deleteBookmark={deleteBookmark}
              />
            </div>
            <a
              href={bookmark.url}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute inset-0 z-10 h-[calc(100%-50px)]"
              onClick={e => e.stopPropagation()}
            ></a>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p className="font-mono text-xs">{bookmark.url}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export default BookmarkCard
