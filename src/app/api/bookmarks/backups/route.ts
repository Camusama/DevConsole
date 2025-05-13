import { NextRequest, NextResponse } from 'next/server'
import { getAllBackups, deleteBackup } from '@/lib/pgBackup'

// 获取备份列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const collectionName = searchParams.get('collection')

    if (!collectionName) {
      return NextResponse.json({ error: '集合名称是必需的' }, { status: 400 })
    }

    const backups = await getAllBackups(collectionName)
    return NextResponse.json({ backups }, { status: 200 })
  } catch (error) {
    console.error('获取备份列表失败:', error)
    return NextResponse.json({ error: '获取备份列表失败' }, { status: 500 })
  }
}