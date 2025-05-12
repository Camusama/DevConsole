import { NextRequest, NextResponse } from 'next/server'
import { getNotes, createNote } from '@/lib/notionClient'

// Get all notes
export async function GET() {
  try {
    const result = await getNotes()
    
    if (result.isSuccess) {
      return NextResponse.json({ notes: result.data }, { status: 200 })
    } else {
      return NextResponse.json({ error: '获取笔记失败' }, { status: 500 })
    }
  } catch (error) {
    console.error('Error in GET /api/notes:', error)
    return NextResponse.json({ error: '获取笔记失败' }, { status: 500 })
  }
}

// Create a new note
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const { title, content } = data

    if (!title) {
      return NextResponse.json({ error: '标题是必填项' }, { status: 400 })
    }

    const result = await createNote(title, content || '')
    
    if (result.isSuccess) {
      return NextResponse.json({ note: result.data }, { status: 201 })
    } else {
      return NextResponse.json({ error: '创建笔记失败' }, { status: 500 })
    }
  } catch (error) {
    console.error('Error in POST /api/notes:', error)
    return NextResponse.json({ error: '创建笔记失败' }, { status: 500 })
  }
}
