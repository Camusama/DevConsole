'use client'

import { S3Object, S3Folder } from '@/lib/s3Client'

// Fetch S3 objects
export const fetchS3Objects = async (prefix: string = ''): Promise<{
  objects: S3Object[]
  folders: S3Folder[]
}> => {
  const response = await fetch(`/api/s3?prefix=${encodeURIComponent(prefix)}`)
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || '获取S3对象失败')
  }
  
  return await response.json()
}

// Delete an S3 object
export const deleteS3Object = async (key: string): Promise<void> => {
  const response = await fetch(`/api/s3?key=${encodeURIComponent(key)}`, {
    method: 'DELETE',
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || '删除S3对象失败')
  }
}

// Delete multiple S3 objects
export const deleteS3Objects = async (keys: string[]): Promise<void> => {
  const response = await fetch('/api/s3/bulk-delete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ keys }),
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || '批量删除S3对象失败')
  }
}

// Get a signed URL for an S3 object
export const getS3ObjectUrl = async (key: string): Promise<string> => {
  const response = await fetch(`/api/s3/url?key=${encodeURIComponent(key)}`)
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || '获取S3对象URL失败')
  }
  
  const data = await response.json()
  return data.url
}

// Get a signed URL for uploading to S3
export const getS3UploadUrl = async (key: string, contentType: string): Promise<string> => {
  const response = await fetch(
    `/api/s3/url?key=${encodeURIComponent(key)}&type=upload&contentType=${encodeURIComponent(contentType)}`
  )
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || '获取S3上传URL失败')
  }
  
  const data = await response.json()
  return data.url
}
