import { NextRequest, NextResponse } from 'next/server'
import { getS3ObjectUrl, getS3UploadUrl } from '@/lib/s3Client'

// Get a signed URL for downloading or uploading an object
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const key = searchParams.get('key')
    const type = searchParams.get('type') || 'download' // download or upload
    const contentType = searchParams.get('contentType') || 'application/octet-stream'

    if (!key) {
      return NextResponse.json({ error: '对象键是必填项' }, { status: 400 })
    }

    let result
    if (type === 'upload') {
      result = await getS3UploadUrl(key, contentType)
    } else {
      result = await getS3ObjectUrl(key)
    }
    
    if (result.isSuccess) {
      return NextResponse.json({ url: result.url }, { status: 200 })
    } else {
      return NextResponse.json({ error: '获取签名URL失败' }, { status: 500 })
    }
  } catch (error) {
    console.error('Error in GET /api/s3/url:', error)
    return NextResponse.json({ error: '获取签名URL失败' }, { status: 500 })
  }
}
