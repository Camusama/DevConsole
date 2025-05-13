'use client'

import { useState } from 'react'
import useSWR, { mutate } from 'swr'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Trash2, RefreshCw, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { BackupRecord } from '@/lib/pgBackup'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface BackupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  collectionName: string
  onRestore: (backupId: number) => Promise<void>
  onRefreshBackups: () => void
}

// Fetcher function for SWR
const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error('Failed to fetch data')
  }
  return res.json()
}

export default function BackupDialog({
  open,
  onOpenChange,
  collectionName,
  onRestore,
  onRefreshBackups,
}: BackupDialogProps) {
  const [isDeleting, setIsDeleting] = useState<number | null>(null)
  const [isRestoring, setIsRestoring] = useState<number | null>(null)

  // Use SWR for data fetching
  const backupsUrl = `/api/bookmarks/backups?collection=${collectionName}`
  const {
    data,
    error,
    isLoading,
    mutate: refreshBackups,
  } = useSWR(
    open ? backupsUrl : null, // Only fetch when dialog is open
    fetcher
  )

  const backups: BackupRecord[] = data?.backups || []

  // Delete backup
  const handleDeleteBackup = async (backupId: number) => {
    if (!confirm('Are you sure you want to delete this backup? This action cannot be undone.')) {
      return
    }

    setIsDeleting(backupId)
    try {
      const response = await fetch(`/api/bookmarks/backups/${backupId}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete backup')

      // Update the local data without refetching
      refreshBackups({ backups: backups.filter(backup => backup.id !== backupId) }, false)
      toast.success('Backup deleted successfully')
    } catch (error) {
      console.error('Failed to delete backup:', error)
      toast.error('Failed to delete backup')
    } finally {
      setIsDeleting(null)
    }
  }

  // Restore backup
  const handleRestore = async (backupId: number) => {
    if (
      !confirm('Are you sure you want to restore this backup? Current data will be overwritten!')
    ) {
      return
    }

    setIsRestoring(backupId)
    try {
      await onRestore(backupId)
      onOpenChange(false) // Close dialog
      onRefreshBackups() // Refresh parent component data
    } catch (error) {
      console.error('Failed to restore backup:', error)
      toast.error('Failed to restore backup')
    } finally {
      setIsRestoring(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>备份历史</DialogTitle>
          <DialogDescription>选择一个备份版本进行恢复，或删除不需要的备份</DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <AlertCircle className="h-10 w-10 text-destructive mb-2" />
              <p className="text-muted-foreground">加载备份列表失败</p>
            </div>
          ) : backups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <AlertCircle className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">没有找到备份记录</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>创建时间</TableHead>
                  <TableHead>项目数量</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {backups.map(backup => (
                  <TableRow key={backup.id}>
                    <TableCell>{new Date(backup.createdAt).toLocaleString('zh-CN')}</TableCell>
                    <TableCell>{Array.isArray(backup.items) ? backup.items.length : 0}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRestore(backup.id)}
                          disabled={isRestoring !== null}
                          className="h-8"
                        >
                          {isRestoring === backup.id ? (
                            <>
                              <RefreshCw className="mr-1 h-3 w-3 animate-spin" />
                              恢复中
                            </>
                          ) : (
                            '恢复'
                          )}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteBackup(backup.id)}
                          disabled={isDeleting !== null}
                          className="h-8"
                        >
                          {isDeleting === backup.id ? (
                            <>
                              <RefreshCw className="mr-1 h-3 w-3 animate-spin" />
                              删除中
                            </>
                          ) : (
                            <Trash2 className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        <div className="flex justify-between mt-4">
          <Button variant="outline" onClick={() => refreshBackups()}>
            刷新列表
          </Button>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            关闭
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
