'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { X, Download, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { S3Object } from '@/lib/s3Client'
import { formatBytes } from '../_utils/formatters'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface FilePreviewProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  object: S3Object | null
}

export default function FilePreview({ isOpen, onOpenChange, object }: FilePreviewProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [textContent, setTextContent] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Get file name from key
  const getFileName = (key: string) => {
    return key.split('/').pop() || key
  }

  // Check if file is previewable
  const isPreviewable = (contentType: string | undefined) => {
    if (!contentType) return false

    return (
      contentType.startsWith('image/') ||
      contentType.startsWith('video/') ||
      contentType.startsWith('audio/') ||
      contentType === 'application/pdf' ||
      contentType === 'text/plain' ||
      contentType === 'text/html' ||
      contentType === 'application/json'
    )
  }

  // Get signed URL for preview and text content for text files
  useEffect(() => {
    const getPreviewData = async () => {
      if (!object || !isOpen) return

      setIsLoading(true)
      setTextContent(null)

      try {
        const response = await fetch(`/api/s3/url?key=${encodeURIComponent(object.key)}`)
        const data = await response.json()

        if (data.url) {
          setPreviewUrl(data.url)
          
          // For text files, fetch content directly to ensure proper UTF-8 handling
          if (object.contentType === 'text/plain' || 
              object.contentType === 'application/json' ||
              object.contentType?.startsWith('text/')) {
            try {
              const textResponse = await fetch(data.url)
              const text = await textResponse.text()
              setTextContent(text)
            } catch (textError) {
              console.error('Error fetching text content:', textError)
              // Fallback to iframe if direct text fetch fails
            }
          }
        } else {
          toast.error('获取预览链接失败')
        }
      } catch (error) {
        console.error('Error getting preview URL:', error)
        toast.error('获取预览链接失败')
      } finally {
        setIsLoading(false)
      }
    }

    if (isOpen && object) {
      getPreviewData()
    } else {
      setPreviewUrl(null)
      setTextContent(null)
    }
  }, [isOpen, object])

  // Handle download
  const handleDownload = () => {
    if (previewUrl && object) {
      // Create a temporary anchor element to trigger download
      const link = document.createElement('a')
      link.href = previewUrl
      link.download = getFileName(object.key)
      link.target = '_blank'
      link.rel = 'noopener noreferrer'
      
      // Append to body, click, and remove
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      toast.success('文件下载已开始')
    }
  }

  if (!object) return null

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="truncate max-w-[400px]">{getFileName(object.key)}</span>
            <div className="text-sm font-normal text-muted-foreground">
              {formatBytes(object.size)}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-[400px]">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : previewUrl && isPreviewable(object.contentType) ? (
            <div className="max-h-[500px] overflow-auto">
              {object.contentType?.startsWith('image/') && (
                <div className="relative w-full h-[400px]">
                  <Image
                    src={previewUrl || ''}
                    alt={getFileName(object.key)}
                    fill
                    style={{ objectFit: 'contain' }}
                    unoptimized // 使用未优化模式，因为我们使用的是预签名URL
                  />
                </div>
              )}

              {object.contentType?.startsWith('video/') && (
                <video src={previewUrl} controls className="max-w-full h-auto mx-auto">
                  您的浏览器不支持视频标签
                </video>
              )}

              {object.contentType?.startsWith('audio/') && (
                <audio src={previewUrl} controls className="w-full mt-4">
                  您的浏览器不支持音频标签
                </audio>
              )}

              {object.contentType === 'application/pdf' && (
                <iframe
                  src={`${previewUrl}#toolbar=0`}
                  className="w-full h-[500px]"
                  title={getFileName(object.key)}
                />
              )}

              {(object.contentType === 'text/plain' ||
                object.contentType === 'application/json' ||
                object.contentType?.startsWith('text/')) && (
                textContent ? (
                  <div className="w-full h-[500px] overflow-auto bg-gray-50 p-4 rounded border">
                    <pre className="whitespace-pre-wrap text-sm font-mono">
                      {textContent}
                    </pre>
                  </div>
                ) : (
                  <iframe
                    src={previewUrl}
                    className="w-full h-[500px]"
                    title={getFileName(object.key)}
                  />
                )
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[300px] bg-muted/20 rounded-md">
              <p className="text-muted-foreground mb-4">无法预览此文件类型</p>
              <Button onClick={handleDownload}>
                <Download className="mr-2 h-4 w-4" />
                下载文件
              </Button>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            关闭
          </Button>
          <Button onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" />
            下载
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
