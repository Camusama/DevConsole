import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

// 获取所有书签
export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db('dev-console')
    const bookmarks = await db.collection('bookmarks').find({}).toArray()

    return NextResponse.json({ bookmarks }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: '获取书签失败' }, { status: 500 })
  }
}

// 创建新书签
export async function POST(request: NextRequest) {
  try {
    const { title, url, category, description } = await request.json()

    if (!title || !url) {
      return NextResponse.json({ error: '标题和URL是必填项' }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db('dev-console')

    const bookmark = {
      title,
      url,
      category: category || '默认',
      description: description || '',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection('bookmarks').insertOne(bookmark)

    return NextResponse.json({ bookmark: { ...bookmark, _id: result.insertedId } }, { status: 201 })
  } catch (error) {
    console.log(error)
    return NextResponse.json({ error: '创建书签失败' }, { status: 500 })
  }
}

// 更新书签
export async function PUT(request: NextRequest) {
  try {
    const { _id, title, url, category, description } = await request.json()

    if (!_id || !title || !url) {
      return NextResponse.json({ error: 'ID、标题和URL是必填项' }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db('dev-console')

    const updatedBookmark = {
      title,
      url,
      category: category || '默认',
      description: description || '',
      updatedAt: new Date(),
    }

    await db
      .collection('bookmarks')
      .updateOne({ _id: new ObjectId(_id) }, { $set: updatedBookmark })

    return NextResponse.json({ bookmark: { ...updatedBookmark, _id } }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: '更新书签失败' }, { status: 500 })
  }
}

// 删除书签
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID是必填项' }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db('dev-console')

    await db.collection('bookmarks').deleteOne({ _id: new ObjectId(id) })

    return NextResponse.json({ message: '书签删除成功' }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: '删除书签失败' }, { status: 500 })
  }
}
