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
import { Bookmark } from '@/app/monitor/uptime-kuma/page'

// 书签图标组件
type BookmarkIconProps = {
  title: string
  isCompact?: boolean
}

const BookmarkIcon = ({ title, isCompact = false }: BookmarkIconProps) => {
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

// 书签操作按钮组件
type BookmarkActionsProps = {
  bookmark: Bookmark
  editBookmark: (bookmark: Bookmark) => void
  deleteBookmark: (id: string) => void
  isCompact?: boolean
}

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

// 书签卡片组件
type BookmarkCardProps = {
  bookmark: Bookmark
  editBookmark: (bookmark: Bookmark) => void
  deleteBookmark: (id: string) => void
  isCompact?: boolean
  isDraggable?: boolean
}

export const BookmarkCard = ({
  bookmark,
  editBookmark,
  deleteBookmark,
  isCompact = false,
  isDraggable = false,
}: BookmarkCardProps) => {
  // 处理卡片点击事件
  const handleCardClick = () => {
    if (!isDraggable) {
      window.open(bookmark.url, '_blank', 'noopener,noreferrer')
    }
  }

  if (isCompact) {
    return (
      <div
        className="flex items-center justify-between p-2 rounded-lg group w-full"
        onClick={handleCardClick}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="flex-shrink-0">
            <BookmarkIcon title={bookmark.title} isCompact={true} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-medium truncate">{bookmark.title}</div>
            <p className="text-xs text-muted-foreground truncate">{bookmark.url}</p>
            {bookmark.description && (
              <p className="text-sm text-muted-foreground truncate">{bookmark.description}</p>
            )}
          </div>
        </div>
        <div className="flex-shrink-0 ml-2" onClick={e => e.stopPropagation()}>
          <BookmarkActions
            bookmark={bookmark}
            editBookmark={editBookmark}
            deleteBookmark={deleteBookmark}
            isCompact={true}
          />
        </div>
      </div>
    )
  }

  return (
    <div
      className={`flex flex-col p-4 w-full ${!isDraggable ? 'cursor-pointer' : ''}`}
      onClick={handleCardClick}
    >
      <div className="flex items-center gap-3 mb-2 min-w-0">
        <div className="flex-shrink-0">
          <BookmarkIcon title={bookmark.title} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-medium truncate">{bookmark.title}</div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground truncate mb-1">{bookmark.url}</p>

      {bookmark.description && (
        <p className="text-sm text-muted-foreground mb-2 line-clamp-2 overflow-hidden text-ellipsis">
          {bookmark.description}
        </p>
      )}

      <div
        className="text-xs text-muted-foreground mt-auto pt-2 border-t flex justify-end items-center"
        onClick={e => e.stopPropagation()}
      >
        <BookmarkActions
          bookmark={bookmark}
          editBookmark={editBookmark}
          deleteBookmark={deleteBookmark}
        />
      </div>
    </div>
  )
}
