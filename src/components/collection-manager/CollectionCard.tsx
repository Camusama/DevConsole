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
import { CollectionCardProps, CollectionActionsProps, CollectionIconProps } from './types'

// Collection icon component
const CollectionIcon = ({ title, isCompact = false }: CollectionIconProps) => {
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

// Collection actions component
const CollectionActions = ({
  item,
  editItem,
  deleteItem,
  isCompact = false,
  config,
}: CollectionActionsProps) => {
  const iconSize = isCompact ? 'h-4 w-4' : 'h-3 w-3'
  const buttonSize = isCompact ? '' : 'h-7 w-7'
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const handleDelete = () => {
    if (item._id) {
      deleteItem(item._id)
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
            editItem(item)
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
            <DialogTitle>{config.deleteConfirmTitle}</DialogTitle>
            <DialogDescription>
              {config.deleteConfirmDescription.replace('{title}', item.title)}
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

// Main collection card component
const CollectionCard = ({
  item,
  editItem,
  deleteItem,
  isCompact = false,
  config,
}: CollectionCardProps) => {
  // Handle card click event
  const handleCardClick = () => {
    window.open(item.url, '_blank', 'noopener,noreferrer')
  }

  if (isCompact) {
    return (
      <div
        key={item._id}
        className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 group transition-all duration-200 transform hover:scale-[1.02] cursor-pointer"
        onClick={handleCardClick}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="flex-shrink-0">
            <CollectionIcon title={item.title} isCompact={true} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-medium truncate">{item.title}</div>
            <p className="text-xs text-muted-foreground truncate">{item.url}</p>
            {item.description && (
              <p className="text-sm text-muted-foreground truncate">{item.description}</p>
            )}
          </div>
        </div>
        <div className="flex-shrink-0 ml-2" onClick={e => e.stopPropagation()}>
          <CollectionActions
            item={item}
            editItem={editItem}
            deleteItem={deleteItem}
            isCompact={true}
            config={config}
          />
        </div>
      </div>
    )
  }

  return (
    <div
      className="group relative flex flex-col p-4 bg-card text-card-foreground rounded-lg border shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden transform hover:scale-[1.02] hover:border-primary/20 cursor-pointer"
      onClick={handleCardClick}
    >
      <div className="flex items-center gap-3 mb-2 min-w-0">
        <div className="flex-shrink-0">
          <CollectionIcon title={item.title} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-medium truncate">{item.title}</div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground truncate mb-1">{item.url}</p>

      {item.description && (
        <p className="text-sm text-muted-foreground mb-2 line-clamp-2 overflow-hidden text-ellipsis">
          {item.description}
        </p>
      )}

      <div
        className="text-xs text-muted-foreground mt-auto pt-2 border-t flex justify-end items-center"
        onClick={e => e.stopPropagation()}
      >
        <CollectionActions
          item={item}
          editItem={editItem}
          deleteItem={deleteItem}
          config={config}
        />
      </div>
    </div>
  )
}

export default CollectionCard
