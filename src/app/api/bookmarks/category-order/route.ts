import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

// Get category order for a specific collection
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const collectionName = searchParams.get('collection') || 'bookmarks'

    const client = await clientPromise
    const db = client.db('dev-console')
    
    // Try to get existing category order
    const categoryOrder = await db.collection('category_orders').findOne({ 
      collectionName 
    })

    if (categoryOrder) {
      return NextResponse.json({ categoryOrder: categoryOrder.order }, { status: 200 })
    } else {
      // If no order exists yet, return empty array
      return NextResponse.json({ categoryOrder: [] }, { status: 200 })
    }
  } catch (error) {
    console.error('Error fetching category order:', error)
    return NextResponse.json({ error: '获取分类顺序失败' }, { status: 500 })
  }
}

// Update category order
export async function PUT(request: NextRequest) {
  try {
    const { order, collectionName = 'bookmarks' } = await request.json()

    if (!Array.isArray(order)) {
      return NextResponse.json({ error: '分类顺序必须是数组' }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db('dev-console')

    // Upsert the category order
    const result = await db.collection('category_orders').updateOne(
      { collectionName },
      { $set: { order, updatedAt: new Date() } },
      { upsert: true }
    )

    return NextResponse.json({ 
      message: '分类顺序更新成功',
      categoryOrder: order 
    }, { status: 200 })
  } catch (error) {
    console.error('Error updating category order:', error)
    return NextResponse.json({ error: '更新分类顺序失败' }, { status: 500 })
  }
}
