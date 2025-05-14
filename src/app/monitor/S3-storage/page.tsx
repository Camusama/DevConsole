'use client'

import { useState } from 'react'
import { Plus, FolderPlus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import useSWR from 'swr'
import { S3Object } from '@/lib/s3Client'
import { fetchS3Objects, deleteS3Object } from './_utils/api'
import FileBrowser from './_components/FileBrowser'
import FileUpload from './_components/FileUpload'
import FilePreview from './_components/FilePreview'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export default function S3StoragePage() {
  // State for current path
  const [currentPath, setCurrentPath] = useState('')

  // State for file upload dialog
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)

  // State for create folder dialog
  const [createFolderDialogOpen, setCreateFolderDialogOpen] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [isCreatingFolder, setIsCreatingFolder] = useState(false)

  // State for file preview
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false)
  const [selectedObject, setSelectedObject] = useState<S3Object | null>(null)

  // Fetch S3 objects with SWR
  const {
    data,
    isLoading,
    mutate: refreshObjects,
  } = useSWR(['s3-objects', currentPath], () => fetchS3Objects(currentPath), {
    revalidateOnFocus: false,
  })

  const objects = data?.objects || []
  const folders = data?.folders || []

  // Handle navigation to a folder
  const handleNavigate = (path: string) => {
    setCurrentPath(path)
  }

  // Handle file preview
  const handlePreview = (object: S3Object) => {
    setSelectedObject(object)
    setPreviewDialogOpen(true)
  }

  // Handle file delete
  const handleDelete = async (key: string) => {
    try {
      await deleteS3Object(key)
      toast.success('文件删除成功')
      refreshObjects()
    } catch (error) {
      console.error('Error deleting file:', error)
      toast.error('删除文件失败')
    }
  }

  // Handle folder creation
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      toast.error('文件夹名称不能为空')
      return
    }

    // Check for invalid characters
    if (/[\\/:*?"<>|]/.test(newFolderName)) {
      toast.error('文件夹名称包含无效字符')
      return
    }

    setIsCreatingFolder(true)

    try {
      // Create an empty file with a trailing slash to represent a folder
      const folderKey = currentPath
        ? `${currentPath}${currentPath.endsWith('/') ? '' : '/'}${newFolderName}/`
        : `${newFolderName}/`

      // Use the server-side API to create a folder
      const response = await fetch('/api/s3/create-folder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ key: folderKey }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '创建文件夹失败')
      }

      toast.success(`文件夹 ${newFolderName} 创建成功`)
      setCreateFolderDialogOpen(false)
      setNewFolderName('')
      refreshObjects()
    } catch (error) {
      console.error('Error creating folder:', error)
      toast.error(error instanceof Error ? error.message : '创建文件夹失败')
    } finally {
      setIsCreatingFolder(false)
    }
  }

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <h1 className="text-2xl font-bold">S3 存储管理</h1>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Button onClick={() => setCreateFolderDialogOpen(true)}>
            <FolderPlus className="mr-2 h-4 w-4" /> 新建文件夹
          </Button>
          <Button onClick={() => setUploadDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> 上传文件
          </Button>
        </div>
      </div>

      <FileBrowser
        currentPath={currentPath}
        onNavigate={handleNavigate}
        onRefresh={refreshObjects}
        onPreview={handlePreview}
        onDelete={handleDelete}
        isLoading={isLoading}
        objects={objects}
        folders={folders}
      />

      {/* File Upload Dialog */}
      <FileUpload
        isOpen={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        currentPath={currentPath}
        onUploadComplete={refreshObjects}
      />

      {/* File Preview Dialog */}
      <FilePreview
        isOpen={previewDialogOpen}
        onOpenChange={setPreviewDialogOpen}
        object={selectedObject}
      />

      {/* Create Folder Dialog */}
      <Dialog open={createFolderDialogOpen} onOpenChange={setCreateFolderDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>新建文件夹</DialogTitle>
            <DialogDescription>在当前目录创建新文件夹: {currentPath || '/'}</DialogDescription>
          </DialogHeader>

          <div className="mt-4">
            <Input
              placeholder="文件夹名称"
              value={newFolderName}
              onChange={e => setNewFolderName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !isCreatingFolder) {
                  handleCreateFolder()
                }
              }}
            />
          </div>

          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setCreateFolderDialogOpen(false)}
              disabled={isCreatingFolder}
            >
              取消
            </Button>
            <Button
              onClick={handleCreateFolder}
              disabled={isCreatingFolder || !newFolderName.trim()}
            >
              {isCreatingFolder ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  创建中...
                </>
              ) : (
                '创建文件夹'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
