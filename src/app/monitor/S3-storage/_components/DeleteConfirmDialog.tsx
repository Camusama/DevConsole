'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface DeleteConfirmDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  title: string
  onConfirm: () => Promise<void>
  isDeleting?: boolean
  isFolder?: boolean
  isBulkDelete?: boolean
}

export default function DeleteConfirmDialog({
  isOpen,
  onOpenChange,
  title,
  onConfirm,
  isDeleting = false,
  isFolder = false,
  isBulkDelete = false,
}: DeleteConfirmDialogProps) {
  const [isConfirming, setIsConfirming] = useState(false)

  const handleConfirm = async () => {
    setIsConfirming(true)
    try {
      await onConfirm()
    } finally {
      setIsConfirming(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>确认删除</DialogTitle>
          <DialogDescription>
            {isBulkDelete ? (
              <>您确定要删除选中的 {title} 吗？此操作无法撤销。</>
            ) : (
              <>
                您确定要删除{isFolder ? '文件夹' : '文件'} &ldquo;{title}&rdquo; 吗？
                {isFolder && '这将删除该文件夹及其所有内容。'}
                此操作无法撤销。
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isConfirming || isDeleting}
          >
            取消
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isConfirming || isDeleting}
          >
            {isConfirming || isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                删除中...
              </>
            ) : (
              '删除'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
