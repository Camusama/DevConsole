'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface FileUploadProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  currentPath: string
  onUploadComplete: () => void
}

type UploadingFile = {
  id: string
  file: File
  progress: number
  status: 'pending' | 'uploading' | 'success' | 'error'
  error?: string
}

export default function FileUpload({
  isOpen,
  onOpenChange,
  currentPath,
  onUploadComplete,
}: FileUploadProps) {
  const [files, setFiles] = useState<UploadingFile[]>([])
  const [isUploading, setIsUploading] = useState(false)

  // Handle file drop
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substring(2, 9),
      file,
      progress: 0,
      status: 'pending' as const,
    }))

    setFiles(prev => [...prev, ...newFiles])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
  })

  // Remove a file from the list
  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(file => file.id !== id))
  }

  // Upload all files
  const uploadFiles = async () => {
    if (files.length === 0) return

    setIsUploading(true)

    let successCount = 0
    let errorCount = 0

    // Process each file
    for (const fileItem of files) {
      try {
        // Update status to uploading
        setFiles(prev => prev.map(f => (f.id === fileItem.id ? { ...f, status: 'uploading' } : f)))

        // Generate key for the file
        const key = currentPath
          ? `${currentPath}${currentPath.endsWith('/') ? '' : '/'}${fileItem.file.name}`
          : fileItem.file.name

        // Create form data for upload
        const formData = new FormData()
        formData.append('file', fileItem.file)
        formData.append('key', key)
        formData.append('contentType', fileItem.file.type)

        // Upload file with progress tracking
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest()

          xhr.open('POST', '/api/s3/upload')

          xhr.upload.onprogress = event => {
            if (event.lengthComputable) {
              const progress = Math.round((event.loaded / event.total) * 100)
              setFiles(prev => prev.map(f => (f.id === fileItem.id ? { ...f, progress } : f)))
            }
          }

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve()
            } else {
              try {
                const response = JSON.parse(xhr.responseText)
                reject(new Error(response.error || `HTTP Error: ${xhr.status}`))
              } catch {
                reject(new Error(`HTTP Error: ${xhr.status}`))
              }
            }
          }

          xhr.onerror = () => reject(new Error('Network Error'))

          xhr.send(formData)
        })

        // Update status to success
        setFiles(prev =>
          prev.map(f => (f.id === fileItem.id ? { ...f, status: 'success', progress: 100 } : f))
        )

        successCount++
      } catch (error) {
        console.error(`Error uploading file ${fileItem.file.name}:`, error)

        // Update status to error
        setFiles(prev =>
          prev.map(f =>
            f.id === fileItem.id
              ? {
                  ...f,
                  status: 'error',
                  error: error instanceof Error ? error.message : '上传失败',
                }
              : f
          )
        )

        errorCount++
      }
    }

    setIsUploading(false)

    // Show toast with results
    if (successCount > 0 && errorCount === 0) {
      toast.success(`成功上传 ${successCount} 个文件`)
      onUploadComplete()
      onOpenChange(false)
      setFiles([])
    } else if (successCount > 0 && errorCount > 0) {
      toast.warning(`上传了 ${successCount} 个文件，${errorCount} 个文件失败`)
      onUploadComplete()
    } else {
      toast.error('所有文件上传失败')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>上传文件</DialogTitle>
          <DialogDescription>将文件上传到当前目录: {currentPath || '/'}</DialogDescription>
        </DialogHeader>

        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-md p-6 mt-2 text-center cursor-pointer
            ${isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300'}
          `}
        >
          <input {...getInputProps()} />
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-600">
            {isDragActive ? '拖放文件到这里...' : '拖放文件到这里，或点击选择文件'}
          </p>
          <p className="text-xs text-gray-500 mt-1">支持任何类型的文件</p>
        </div>

        {files.length > 0 && (
          <div className="mt-4 space-y-3 max-h-60 overflow-y-auto">
            {files.map(fileItem => (
              <div key={fileItem.id} className="flex items-center space-x-2">
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium truncate max-w-[200px]">
                      {fileItem.file.name}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5"
                      onClick={() => removeFile(fileItem.id)}
                      disabled={isUploading}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  <Progress value={fileItem.progress} className="h-2" />
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-gray-500">
                      {(fileItem.file.size / 1024).toFixed(1)} KB
                    </span>
                    <span className="text-xs">
                      {fileItem.status === 'pending' && '等待上传'}
                      {fileItem.status === 'uploading' && `${fileItem.progress}%`}
                      {fileItem.status === 'success' && '上传成功'}
                      {fileItem.status === 'error' && (
                        <span className="text-red-500">上传失败</span>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isUploading}>
            取消
          </Button>
          <Button onClick={uploadFiles} disabled={files.length === 0 || isUploading}>
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                上传中...
              </>
            ) : (
              '上传文件'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
