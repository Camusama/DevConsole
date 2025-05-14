import { NextRequest, NextResponse } from 'next/server'
import { deleteS3Objects } from '@/lib/s3Client'

// Delete multiple objects from S3
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const { keys } = data

    if (!keys || !Array.isArray(keys) || keys.length === 0) {
      return NextResponse.json({ error: '对象键列表是必填项' }, { status: 400 })
    }

    const result = await deleteS3Objects(keys)
    
    if (result.isSuccess) {
      return NextResponse.json({ message: '对象批量删除成功' }, { status: 200 })
    } else {
      return NextResponse.json({ error: '批量删除S3对象失败' }, { status: 500 })
    }
  } catch (error) {
    console.error('Error in POST /api/s3/bulk-delete:', error)
    return NextResponse.json({ error: '批量删除S3对象失败' }, { status: 500 })
  }
}
