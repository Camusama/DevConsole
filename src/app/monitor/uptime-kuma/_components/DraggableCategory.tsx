'use client'

import { ChevronDown, GripVertical } from 'lucide-react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'
import { Bookmark } from '@/app/monitor/uptime-kuma/page'

type DraggableCategoryProps = {
  id: string
  category: string
  bookmarks: Bookmark[]
  isCollapsed: boolean
  toggleCategory: (category: string) => void
  children: React.ReactNode
}

const DraggableCategory = ({
  id,
  category,
  bookmarks,
  isCollapsed,
  toggleCategory,
  children,
}: DraggableCategoryProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.8 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} className="w-full mb-6">
      <Collapsible
        defaultOpen={true}
        open={!isCollapsed}
        onOpenChange={() => toggleCategory(category)}
        className="w-full"
      >
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between border-b pb-3 mb-5 cursor-pointer group">
            <div className="flex items-center gap-3">
              <div
                {...attributes}
                {...listeners}
                className="flex items-center gap-2 cursor-grab active:cursor-grabbing"
              >
                <div className="text-muted-foreground/60 hover:text-muted-foreground transition-colors">
                  <GripVertical className="h-5 w-5" />
                </div>
                <ChevronDown
                  className={cn(
                    'h-5 w-5 transition-transform duration-200 text-muted-foreground/70 hover:text-muted-foreground',
                    !isCollapsed ? 'transform rotate-0' : 'transform rotate-180'
                  )}
                />
              </div>
              <h2 className="text-xl font-semibold">
                {category}{' '}
                <span className="text-sm text-muted-foreground">({bookmarks?.length || 0})</span>
              </h2>
            </div>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          {bookmarks?.length ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {children}
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">该分类下暂无书签</div>
          )}
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}

export default DraggableCategory
