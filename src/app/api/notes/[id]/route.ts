import { NextRequest, NextResponse } from 'next/server'
import { getNote, updateNote, deleteNote } from '@/lib/notionClient'

// Get a single note
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id
    
    if (!id) {
      return NextResponse.json({ error: 'ID是必填项' }, { status: 400 })
    }

    const result = await getNote(id)
    
    if (result.isSuccess) {
      return NextResponse.json({ note: result.data }, { status: 200 })
    } else {
      return NextResponse.json({ error: '获取笔记失败' }, { status: 500 })
    }
  } catch (error) {
    console.error('Error in GET /api/notes/[id]:', error)
    return NextResponse.json({ error: '获取笔记失败' }, { status: 500 })
  }
}

// Update a note
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id
    const data = await request.json()
    const { title, content } = data
    
    if (!id || !title) {
      return NextResponse.json({ error: 'ID和标题是必填项' }, { status: 400 })
    }

    const result = await updateNote(id, title, content || '')
    
    if (result.isSuccess) {
      return NextResponse.json({ note: result.data }, { status: 200 })
    } else {
      return NextResponse.json({ error: '更新笔记失败' }, { status: 500 })
    }
  } catch (error) {
    console.error('Error in PUT /api/notes/[id]:', error)
    return NextResponse.json({ error: '更新笔记失败' }, { status: 500 })
  }
}

// Delete a note
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id
    
    if (!id) {
      return NextResponse.json({ error: 'ID是必填项' }, { status: 400 })
    }

    const result = await deleteNote(id)
    
    if (result.isSuccess) {
      return NextResponse.json({ message: '笔记删除成功' }, { status: 200 })
    } else {
      return NextResponse.json({ error: '删除笔记失败' }, { status: 500 })
    }
  } catch (error) {
    console.error('Error in DELETE /api/notes/[id]:', error)
    return NextResponse.json({ error: '删除笔记失败' }, { status: 500 })
  }
}
