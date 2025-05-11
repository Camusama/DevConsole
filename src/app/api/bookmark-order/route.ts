import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

// Get bookmark order for a specific category
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    
    if (!category) {
      return NextResponse.json({ error: '分类参数是必填项' }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db('dev-console')
    
    // Try to get existing bookmark order
    const bookmarkOrder = await db.collection('bookmark_orders').findOne({ 
      category 
    })

    if (bookmarkOrder) {
      return NextResponse.json({ bookmarkOrder: bookmarkOrder.order }, { status: 200 })
    } else {
      // If no order exists yet, return empty array
      return NextResponse.json({ bookmarkOrder: [] }, { status: 200 })
    }
  } catch (error) {
    console.error('Error fetching bookmark order:', error)
    return NextResponse.json({ error: '获取书签顺序失败' }, { status: 500 })
  }
}

// Update bookmark order
export async function PUT(request: NextRequest) {
  try {
    const { order, category } = await request.json()

    if (!category) {
      return NextResponse.json({ error: '分类参数是必填项' }, { status: 400 })
    }

    if (!Array.isArray(order)) {
      return NextResponse.json({ error: '书签顺序必须是数组' }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db('dev-console')

    // Upsert the bookmark order
    const result = await db.collection('bookmark_orders').updateOne(
      { category },
      { $set: { order, updatedAt: new Date() } },
      { upsert: true }
    )

    return NextResponse.json({ 
      message: '书签顺序更新成功',
      bookmarkOrder: order 
    }, { status: 200 })
  } catch (error) {
    console.error('Error updating bookmark order:', error)
    return NextResponse.json({ error: '更新书签顺序失败' }, { status: 500 })
  }
}
