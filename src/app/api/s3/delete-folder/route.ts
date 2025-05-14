import { NextRequest, NextResponse } from 'next/server'
import { S3Client, ListObjectsV2Command, DeleteObjectsCommand } from '@aws-sdk/client-s3'

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

// Delete a folder and all its contents from S3
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const { prefix } = data

    if (!prefix) {
      return NextResponse.json({ error: '文件夹路径是必填项' }, { status: 400 })
    }

    // Ensure prefix ends with a slash to represent a folder
    const folderPrefix = prefix.endsWith('/') ? prefix : `${prefix}/`

    // List all objects with the folder prefix
    const listCommand = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: folderPrefix,
    })

    const listedObjects = await s3Client.send(listCommand)

    if (!listedObjects.Contents || listedObjects.Contents.length === 0) {
      return NextResponse.json({ error: '文件夹为空或不存在' }, { status: 404 })
    }

    // Create a list of objects to delete
    const objectsToDelete = listedObjects.Contents.map(({ Key }) => ({ Key })).filter(
      (item): item is { Key: string } => item.Key !== undefined
    )

    // Delete all objects in the folder
    const deleteCommand = new DeleteObjectsCommand({
      Bucket: bucketName,
      Delete: {
        Objects: objectsToDelete,
        Quiet: false,
      },
    })

    await s3Client.send(deleteCommand)

    return NextResponse.json({ 
      message: '文件夹删除成功',
      deletedCount: objectsToDelete.length,
    }, { status: 200 })
  } catch (error) {
    console.error('Error deleting folder from S3:', error)
    return NextResponse.json({ error: '删除文件夹失败' }, { status: 500 })
  }
}
