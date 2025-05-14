'use client'

import { useState, useEffect } from 'react'
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
  ChevronRight,
  RefreshCw,
  Trash2,
  Download,
  Eye,
  MoreHorizontal,
  FolderUp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { S3Object, S3Folder } from '@/lib/s3Client'
import { formatBytes, formatDate } from '../_utils/formatters'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import DeleteConfirmDialog from './DeleteConfirmDialog'

interface FileBrowserProps {
  currentPath: string
  onNavigate: (path: string) => void
  onRefresh: () => void
  onPreview: (object: S3Object) => void
  onDelete: (key: string) => void
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
  isLoading,
  objects,
  folders,
}: FileBrowserProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [objectToDelete, setObjectToDelete] = useState<string>('')
  const [objectNameToDelete, setObjectNameToDelete] = useState<string>('')

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
  const handleDeleteClick = (key: string, name: string) => {
    setObjectToDelete(key)
    setObjectNameToDelete(name)
    setDeleteDialogOpen(true)
  }

  // Confirm delete
  const confirmDelete = async () => {
    if (!objectToDelete) return

    try {
      onDelete(objectToDelete)
      setDeleteDialogOpen(false)
    } catch (error) {
      console.error('Error deleting object:', error)
      toast.error('删除对象失败')
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
                <TableHead className="w-[400px]">名称</TableHead>
                <TableHead>大小</TableHead>
                <TableHead>修改日期</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFolders.length === 0 && filteredObjects.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    没有找到文件或文件夹
                  </TableCell>
                </TableRow>
              )}

              {filteredFolders.map(folder => (
                <TableRow key={folder.path}>
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
                      onClick={() => handleDeleteClick(folder.path, folder.name)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}

              {filteredObjects.map(object => (
                <TableRow key={object.key}>
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

      <DeleteConfirmDialog
        isOpen={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={objectNameToDelete}
        onConfirm={confirmDelete}
      />
    </div>
  )
}
