'use server'

import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  S3ClientConfig,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

// Initialize S3 client with Cloudflare R2 support
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'auto',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
  endpoint: process.env.AWS_ENDPOINT_URL || '',
  forcePathStyle: true, // Required for Cloudflare R2
})

// S3 bucket name
const bucketName = process.env.AWS_S3_BUCKET_NAME || ''

// Type definitions
export type S3Object = {
  key: string
  size: number
  lastModified: Date
  isFolder: boolean
  contentType?: string
  url?: string
}

export type S3Folder = {
  name: string
  path: string
}

// List objects in a bucket with optional prefix (folder path)
export async function listS3Objects(prefix: string = ''): Promise<{
  isSuccess: boolean
  data: S3Object[]
  folders: S3Folder[]
  error?: any
}> {
  try {
    // Ensure prefix ends with a slash if it's not empty
    if (prefix && !prefix.endsWith('/')) {
      prefix = `${prefix}/`
    }

    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: prefix,
      Delimiter: '/',
    })

    const response = await s3Client.send(command)

    // Process folders (CommonPrefixes)
    const folders: S3Folder[] = (response.CommonPrefixes || []).map(prefix => {
      const name = prefix.Prefix?.replace(prefix.Prefix, '').replace(/\/$/, '') || ''
      return {
        name: name || prefix.Prefix?.split('/').filter(Boolean).pop() || '',
        path: prefix.Prefix || '',
      }
    })

    // Process files
    const objects: S3Object[] = (response.Contents || [])
      .map(item => {
        // Skip the directory itself if listed
        if (item.Key === prefix) {
          return null
        }

        const key = item.Key || ''
        const isFolder = key.endsWith('/')

        return {
          key,
          size: item.Size || 0,
          lastModified: item.LastModified || new Date(),
          isFolder,
          contentType: getContentType(key),
        }
      })
      .filter(Boolean) as S3Object[]

    return {
      isSuccess: true,
      data: objects,
      folders,
    }
  } catch (error) {
    console.error('Error listing S3 objects:', error)
    return {
      isSuccess: false,
      data: [],
      folders: [],
      error,
    }
  }
}

// Get a signed URL for downloading an object
export async function getS3ObjectUrl(key: string): Promise<{
  isSuccess: boolean
  url?: string
  error?: any
}> {
  try {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
      ResponseContentDisposition: `attachment; filename*=UTF-8''${encodeURIComponent(key.split('/').pop() || key)}`,
      ResponseContentType: 'application/octet-stream; charset=utf-8',
      ResponseContentEncoding: 'utf-8',
    })

    // URL expires in 1 hour
    const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 })

    return {
      isSuccess: true,
      url,
    }
  } catch (error) {
    console.error('Error generating signed URL:', error)
    return {
      isSuccess: false,
      error,
    }
  }
}

// Get a signed URL for uploading an object
export async function getS3UploadUrl(
  key: string,
  contentType: string
): Promise<{
  isSuccess: boolean
  url?: string
  error?: any
}> {
  try {
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      ContentType: contentType,
    })

    // URL expires in 1 hour
    const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 })

    return {
      isSuccess: true,
      url,
    }
  } catch (error) {
    console.error('Error generating upload URL:', error)
    return {
      isSuccess: false,
      error,
    }
  }
}

// Delete an object from S3
export async function deleteS3Object(key: string): Promise<{
  isSuccess: boolean
  error?: any
}> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    })

    await s3Client.send(command)

    return {
      isSuccess: true,
    }
  } catch (error) {
    console.error('Error deleting S3 object:', error)
    return {
      isSuccess: false,
      error,
    }
  }
}

// Delete multiple objects from S3
export async function deleteS3Objects(keys: string[]): Promise<{
  isSuccess: boolean
  error?: any
}> {
  try {
    const command = new DeleteObjectsCommand({
      Bucket: bucketName,
      Delete: {
        Objects: keys.map(key => ({ Key: key })),
        Quiet: false,
      },
    })

    await s3Client.send(command)

    return {
      isSuccess: true,
    }
  } catch (error) {
    console.error('Error deleting multiple S3 objects:', error)
    return {
      isSuccess: false,
      error,
    }
  }
}

// Helper function to determine content type based on file extension
function getContentType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || ''

  const contentTypes: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    txt: 'text/plain',
    html: 'text/html',
    css: 'text/css',
    js: 'application/javascript',
    json: 'application/json',
    xml: 'application/xml',
    zip: 'application/zip',
    mp3: 'audio/mpeg',
    mp4: 'video/mp4',
    webm: 'video/webm',
  }

  return contentTypes[ext] || 'application/octet-stream'
}
