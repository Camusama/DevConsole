'use client'

import { useState } from 'react'
import {
  Folder,
  File,
  FileText,
  Image,
  Film,
  Music,
  Archive,
  FileCode,
  FileX,
  RefreshCw,
  Trash2,
  Download,
  Eye,
  FolderUp,
  CheckSquare,
  Square,
  Trash,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import type { S3Object, S3Folder } from '@/lib/s3Client'
import { formatBytes, formatDate } from '../_utils/formatters'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

import DeleteConfirmDialog from './DeleteConfirmDialog'

interface FileBrowserProps {
  currentPath: string
  onNavigate: (path: string) => void
  onRefresh: () => void
  onPreview: (object: S3Object) => void
  onDelete: (key: string) => void
  onBulkDelete: (keys: string[]) => Promise<void>
  isLoading: boolean
  objects: S3Object[]
  folders: S3Folder[]
}

export default function FileBrowser({
  currentPath,
  onNavigate,
  onRefresh,
  onPreview,
  onDelete,
  onBulkDelete,
  isLoading,
  objects,
  folders,
}: FileBrowserProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [objectToDelete, setObjectToDelete] = useState<string>('')
  const [objectNameToDelete, setObjectNameToDelete] = useState<string>('')
  const [isFolder, setIsFolder] = useState<boolean>(false)

  // 多选相关状态
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false)

  // Filter objects based on search term
  const filteredObjects = objects.filter(obj =>
    obj.key.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredFolders = folders.filter(folder =>
    folder.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Handle navigation to a folder
  const handleFolderClick = (path: string) => {
    onNavigate(path)
  }

  // Handle navigation to parent folder
  const handleParentFolderClick = () => {
    if (!currentPath) return

    // Remove trailing slash if present
    const path = currentPath.endsWith('/') ? currentPath.slice(0, -1) : currentPath

    // Get parent path
    const lastSlashIndex = path.lastIndexOf('/')
    const parentPath = lastSlashIndex > 0 ? path.substring(0, lastSlashIndex) : ''

    onNavigate(parentPath)
  }

  // Handle file icon based on content type
  const getFileIcon = (object: S3Object) => {
    if (object.isFolder) return <Folder className="h-5 w-5" />

    const contentType = object.contentType || ''

    if (contentType.startsWith('image/')) return <Image className="h-5 w-5" />
    if (contentType.startsWith('video/')) return <Film className="h-5 w-5" />
    if (contentType.startsWith('audio/')) return <Music className="h-5 w-5" />
    if (contentType === 'application/pdf') return <FileX className="h-5 w-5" />
    if (contentType === 'application/zip' || contentType === 'application/x-zip-compressed')
      return <Archive className="h-5 w-5" />
    if (contentType === 'text/plain' || contentType === 'application/json')
      return <FileText className="h-5 w-5" />
    if (
      contentType === 'text/html' ||
      contentType === 'text/css' ||
      contentType === 'application/javascript'
    )
      return <FileCode className="h-5 w-5" />

    return <File className="h-5 w-5" />
  }

  // Handle file name display
  const getFileName = (key: string) => {
    // Remove the current path prefix
    let fileName = key
    if (currentPath && key.startsWith(currentPath)) {
      fileName = key.substring(currentPath.length)
    }

    // Remove leading slash if present
    if (fileName.startsWith('/')) {
      fileName = fileName.substring(1)
    }

    return fileName
  }

  // Handle delete confirmation
  const handleDeleteClick = (key: string, name: string, folder = false) => {
    setObjectToDelete(key)
    setObjectNameToDelete(name)
    setIsFolder(folder)
    setDeleteDialogOpen(true)
  }

  // Confirm delete
  const confirmDelete = async () => {
    if (!objectToDelete) return

    try {
      if (isFolder) {
        // 使用专门的文件夹删除 API
        const response = await fetch('/api/s3/delete-folder', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ prefix: objectToDelete }),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || '删除文件夹失败')
        }

        toast.success('文件夹删除成功')
        onRefresh() // 刷新文件列表
      } else {
        // 使用常规文件删除
        onDelete(objectToDelete)
      }
      setDeleteDialogOpen(false)
    } catch (error) {
      console.error('Error deleting object:', error)
      toast.error(error instanceof Error ? error.message : '删除对象失败')
    }
  }

  // Handle download
  const handleDownload = async (object: S3Object) => {
    try {
      const response = await fetch(`/api/s3/url?key=${encodeURIComponent(object.key)}`)
      const data = await response.json()

      if (data.url) {
        // Open in new tab
        window.open(data.url, '_blank')
      } else {
        toast.error('获取下载链接失败')
      }
    } catch (error) {
      console.error('Error downloading object:', error)
      toast.error('下载对象失败')
    }
  }

  // 切换选择状态
  const toggleItemSelection = (key: string) => {
    setSelectedItems(prev => {
      if (prev.includes(key)) {
        return prev.filter(item => item !== key)
      } else {
        return [...prev, key]
      }
    })
  }

  // 全选当前目录下的文件
  const selectAllFiles = () => {
    const fileKeys = filteredObjects.map(obj => obj.key)
    setSelectedItems(fileKeys)
  }

  // 取消全选
  const deselectAll = () => {
    setSelectedItems([])
  }

  // 批量删除确认
  const confirmBulkDelete = async () => {
    if (selectedItems.length === 0) return

    try {
      await onBulkDelete(selectedItems)
      setBulkDeleteDialogOpen(false)
      setSelectedItems([])
      toast.success(`成功删除 ${selectedItems.length} 个文件`)
    } catch (error) {
      console.error('Error bulk deleting objects:', error)
      toast.error(error instanceof Error ? error.message : '批量删除文件失败')
    }
  }

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          {currentPath && (
            <Button variant="ghost" size="sm" onClick={handleParentFolderClick}>
              <FolderUp className="h-4 w-4 mr-1" />
              上级目录
            </Button>
          )}
          <div className="flex items-center text-sm text-muted-foreground">
            <span className="font-medium">当前路径:</span>
            <span className="ml-2 font-mono">{currentPath || '/'}</span>
          </div>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Input
            placeholder="搜索文件..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full sm:w-64"
          />
          <Button variant="outline" size="icon" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 批量操作栏 - 当选择了文件时显示 */}
      {selectedItems.length > 0 && (
        <div className="flex justify-between items-center mb-4 p-2 bg-muted/30 rounded-md">
          <div className="flex items-center gap-2">
            <span className="text-sm">已选择 {selectedItems.length} 个文件</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={selectAllFiles}
              disabled={filteredObjects.length === 0}
            >
              全选
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={deselectAll}
              disabled={selectedItems.length === 0}
            >
              取消全选
            </Button>
          </div>
          <Button variant="destructive" size="sm" onClick={() => setBulkDeleteDialogOpen(true)}>
            <Trash className="h-4 w-4 mr-2" />
            删除所选
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="w-full">
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-center space-x-4">
                <Skeleton className="h-10 w-10" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[250px]" />
                  <Skeleton className="h-4 w-[200px]" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10"></TableHead>
                <TableHead className="w-[390px]">名称</TableHead>
                <TableHead>大小</TableHead>
                <TableHead>修改日期</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFolders.length === 0 && filteredObjects.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    没有找到文件或文件夹
                  </TableCell>
                </TableRow>
              )}

              {filteredFolders.map(folder => (
                <TableRow key={folder.path}>
                  <TableCell className="w-10">{/* 文件夹不支持多选 */}</TableCell>
                  <TableCell className="font-medium">
                    <div
                      className="flex items-center cursor-pointer hover:text-blue-600"
                      onClick={() => handleFolderClick(folder.path)}
                    >
                      <Folder className="h-5 w-5 mr-2 text-blue-500" />
                      {folder.name}/
                    </div>
                  </TableCell>
                  <TableCell>-</TableCell>
                  <TableCell>-</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteClick(folder.path, folder.name, true)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}

              {filteredObjects.map(object => (
                <TableRow key={object.key}>
                  <TableCell className="w-10">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleItemSelection(object.key)}
                      className="p-0"
                    >
                      {selectedItems.includes(object.key) ? (
                        <CheckSquare className="h-5 w-5 text-primary" />
                      ) : (
                        <Square className="h-5 w-5" />
                      )}
                    </Button>
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="flex items-center">
                      {getFileIcon(object)}
                      <span className="ml-2">{getFileName(object.key)}</span>
                    </div>
                  </TableCell>
                  <TableCell>{formatBytes(object.size)}</TableCell>
                  <TableCell>{formatDate(object.lastModified)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end">
                      {!object.isFolder && (
                        <>
                          <Button variant="ghost" size="icon" onClick={() => onPreview(object)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDownload(object)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClick(object.key, getFileName(object.key))}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* 单个文件/文件夹删除对话框 */}
      <DeleteConfirmDialog
        isOpen={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={objectNameToDelete}
        onConfirm={confirmDelete}
        isFolder={isFolder}
      />

      {/* 批量删除对话框 */}
      <DeleteConfirmDialog
        isOpen={bulkDeleteDialogOpen}
        onOpenChange={setBulkDeleteDialogOpen}
        title={`${selectedItems.length} 个文件`}
        onConfirm={confirmBulkDelete}
        isFolder={false}
        isBulkDelete={true}
      />
    </div>
  )
}
