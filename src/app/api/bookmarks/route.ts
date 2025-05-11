import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

// 获取所有书签
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const collectionName = searchParams.get('collection') || 'bookmarks'

    const client = await clientPromise
    const db = client.db('dev-console')
    const bookmarks = await db.collection(collectionName).find({}).toArray()

    return NextResponse.json({ bookmarks }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: '获取书签失败' }, { status: 500 })
  }
}

// 创建新书签（支持批量添加）
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const collectionName = data.collection || 'bookmarks'

    // Remove collection field from data if it exists
    if (Array.isArray(data)) {
      data.forEach(item => {
        if (item.collection) delete item.collection
      })
    } else if (data.collection) {
      delete data.collection
    }

    // 检查是否为批量添加
    if (Array.isArray(data)) {
      if (data.length === 0) {
        return NextResponse.json({ error: '没有提供有效的书签数据' }, { status: 400 })
      }

      // 验证每个书签
      for (const item of data) {
        if (!item.title || !item.url) {
          return NextResponse.json({ error: '每个书签的标题和URL都是必填项' }, { status: 400 })
        }
      }

      const client = await clientPromise
      const db = client.db('dev-console')

      // 准备批量插入的数据
      const bookmarks = data.map(item => ({
        title: item.title,
        url: item.url,
        category: item.category || '默认',
        description: item.description || '',
        createdAt: new Date(),
        updatedAt: new Date(),
      }))

      const result = await db.collection(collectionName).insertMany(bookmarks)

      return NextResponse.json(
        {
          message: `成功添加 ${result.insertedCount} 个书签`,
          bookmarks: Object.values(result.insertedIds).map((id, index) => ({
            ...bookmarks[index],
            _id: id,
          })),
        },
        { status: 201 }
      )
    } else {
      // 单个书签添加
      const { title, url, category, description } = data

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

      const result = await db.collection(collectionName).insertOne(bookmark)

      return NextResponse.json(
        { bookmark: { ...bookmark, _id: result.insertedId } },
        { status: 201 }
      )
    }
  } catch (error) {
    console.log(error)
    return NextResponse.json({ error: '创建书签失败' }, { status: 500 })
  }
}

// 更新书签
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json()
    const { _id, title, url, category, description } = data
    const collectionName = data.collection || 'bookmarks'

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
      .collection(collectionName)
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
    const collectionName = searchParams.get('collection') || 'bookmarks'

    if (!id) {
      return NextResponse.json({ error: 'ID是必填项' }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db('dev-console')

    await db.collection(collectionName).deleteOne({ _id: new ObjectId(id) })

    return NextResponse.json({ message: '书签删除成功' }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: '删除书签失败' }, { status: 500 })
  }
}
