'use client'

import { GripVertical } from 'lucide-react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Bookmark } from '@/app/monitor/uptime-kuma/page'
import { BookmarkActions } from './BookmarkCard'

type DraggableBookmarkProps = {
  id: string
  bookmark: Bookmark
  editBookmark: (bookmark: Bookmark) => void
  deleteBookmark: (id: string) => void
  isCompact?: boolean
}

const DraggableBookmark = ({
  id,
  bookmark,
  editBookmark,
  deleteBookmark,
  isCompact = false,
}: DraggableBookmarkProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    animateLayoutChanges: () => false, // 禁用布局动画以提高性能
    transition: {
      duration: 150, // 更快的过渡动画
      easing: 'cubic-bezier(0.25, 1, 0.5, 1)', // 更平滑的缓动函数
    },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
    opacity: isDragging ? 0.9 : 1,
    // 使用类型断言来解决TypeScript错误
    ...(isDragging
      ? {
          boxShadow: '0 5px 15px rgba(0, 0, 0, 0.15)',
        }
      : {}),
  } as React.CSSProperties

  // 处理卡片点击事件
  const handleCardClick = () => {
    window.open(bookmark.url, '_blank', 'noopener,noreferrer')
  }

  if (isCompact) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 group transition-all duration-200 transform hover:scale-[1.02] cursor-pointer border"
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div
            {...attributes}
            {...listeners}
            className="flex-shrink-0 cursor-grab active:cursor-grabbing"
            onClick={e => e.stopPropagation()}
          >
            <GripVertical className="h-5 w-5 text-muted-foreground/60 hover:text-muted-foreground transition-colors" />
          </div>
          <div className="flex-shrink-0">
            <div className="w-6 h-6 rounded bg-muted flex items-center justify-center text-muted-foreground text-xs font-medium">
              {bookmark.title.charAt(0).toUpperCase()}
            </div>
          </div>
          <div className="min-w-0 flex-1" onClick={handleCardClick}>
            <div className="font-medium truncate">{bookmark.title}</div>
            <p className="text-xs text-muted-foreground truncate">{bookmark.url}</p>
            {bookmark.description && (
              <p className="text-sm text-muted-foreground truncate">{bookmark.description}</p>
            )}
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
      </div>
    )
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative flex flex-col bg-card text-card-foreground rounded-lg border shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden transform hover:scale-[1.02] hover:border-primary/20"
    >
      <div className="flex items-center p-4 pb-2">
        <div
          {...attributes}
          {...listeners}
          className="flex-shrink-0 mr-2 cursor-grab active:cursor-grabbing"
          onClick={e => e.stopPropagation()}
        >
          <GripVertical className="h-5 w-5 text-muted-foreground/60 hover:text-muted-foreground transition-colors" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate">{bookmark.title}</div>
        </div>
      </div>
      <div onClick={handleCardClick}>
        <div className="px-4 pb-4">
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
      </div>
    </div>
  )
}

export default DraggableBookmark
