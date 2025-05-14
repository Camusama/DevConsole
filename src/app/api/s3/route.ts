import { NextRequest, NextResponse } from 'next/server'
import { listS3Objects, getS3ObjectUrl, deleteS3Object } from '@/lib/s3Client'

// List objects in S3 bucket
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const prefix = searchParams.get('prefix') || ''

    const result = await listS3Objects(prefix)
    
    if (result.isSuccess) {
      return NextResponse.json({ 
        objects: result.data,
        folders: result.folders
      }, { status: 200 })
    } else {
      return NextResponse.json({ error: '获取S3对象列表失败' }, { status: 500 })
    }
  } catch (error) {
    console.error('Error in GET /api/s3:', error)
    return NextResponse.json({ error: '获取S3对象列表失败' }, { status: 500 })
  }
}

// Delete an object from S3
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const key = searchParams.get('key')

    if (!key) {
      return NextResponse.json({ error: '对象键是必填项' }, { status: 400 })
    }

    const result = await deleteS3Object(key)
    
    if (result.isSuccess) {
      return NextResponse.json({ message: '对象删除成功' }, { status: 200 })
    } else {
      return NextResponse.json({ error: '删除S3对象失败' }, { status: 500 })
    }
  } catch (error) {
    console.error('Error in DELETE /api/s3:', error)
    return NextResponse.json({ error: '删除S3对象失败' }, { status: 500 })
  }
}
