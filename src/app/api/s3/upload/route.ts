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

// Upload a file to S3
export async function POST(request: NextRequest) {
  try {
    // Get form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const key = formData.get('key') as string
    const contentType = formData.get('contentType') as string

    if (!file || !key) {
      return NextResponse.json({ error: '文件和键是必填项' }, { status: 400 })
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer())

    // Upload to S3
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: buffer,
      ContentType: contentType || file.type,
    })

    await s3Client.send(command)

    return NextResponse.json({ 
      message: '文件上传成功',
      key,
      size: file.size,
    }, { status: 200 })
  } catch (error) {
    console.error('Error uploading file to S3:', error)
    return NextResponse.json({ error: '上传文件失败' }, { status: 500 })
  }
}

// Increase payload size limit for file uploads
export const config = {
  api: {
    bodyParser: false,
    responseLimit: '50mb',
  },
}
