import { NextRequest, NextResponse } from 'next/server'
import { deleteBackup } from '@/lib/pgBackup'

// 删除备份
export async function DELETE(request: NextRequest, { params }) {
  try {
    const { id } = await params

    const backupId = parseInt(id, 10)

    if (isNaN(backupId)) {
      return NextResponse.json({ error: '无效的备份ID' }, { status: 400 })
    }

    const success = await deleteBackup(backupId)

    if (success) {
      return NextResponse.json({ message: '备份已成功删除' }, { status: 200 })
    } else {
      return NextResponse.json({ error: '找不到指定的备份' }, { status: 404 })
    }
  } catch (error) {
    console.error('删除备份失败:', error)
    return NextResponse.json({ error: '删除备份失败' }, { status: 500 })
  }
}
