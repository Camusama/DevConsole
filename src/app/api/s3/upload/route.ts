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

    // Convert file to buffer with proper encoding handling
    let buffer: Buffer
    const fileType = contentType || file.type
    
    // For text files, ensure UTF-8 encoding is preserved
    if (fileType.startsWith('text/') || 
        fileType === 'application/json' || 
        fileType === 'application/javascript' || 
        fileType === 'application/xml' ||
        fileType.includes('charset')) {
      // For text files, read as text first to ensure UTF-8 encoding
      const text = await file.text()
      buffer = Buffer.from(text, 'utf8')
    } else {
      // For binary files, use arrayBuffer directly
      buffer = Buffer.from(await file.arrayBuffer())
    }

    // Upload to S3 with proper encoding for Chinese filenames and content
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: buffer,
      ContentType: fileType.includes('charset') ? fileType : `${fileType}; charset=utf-8`,
      ContentEncoding: fileType.startsWith('text/') ? 'utf-8' : undefined,
      ContentDisposition: `attachment; filename*=UTF-8''${encodeURIComponent(file.name)}`,
      Metadata: {
        'original-filename': encodeURIComponent(file.name),
        'content-encoding': 'utf-8',
      },
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
