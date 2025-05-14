import { NextRequest, NextResponse } from 'next/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

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

// Create a folder in S3
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const { key } = data

    if (!key) {
      return NextResponse.json({ error: '文件夹路径是必填项' }, { status: 400 })
    }

    // Ensure key ends with a slash to represent a folder
    const folderKey = key.endsWith('/') ? key : `${key}/`

    // Create an empty object with a trailing slash to represent a folder
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: folderKey,
      ContentType: 'application/x-directory',
      Body: '',
    })

    await s3Client.send(command)

    return NextResponse.json({ 
      message: '文件夹创建成功',
      key: folderKey,
    }, { status: 200 })
  } catch (error) {
    console.error('Error creating folder in S3:', error)
    return NextResponse.json({ error: '创建文件夹失败' }, { status: 500 })
  }
}
