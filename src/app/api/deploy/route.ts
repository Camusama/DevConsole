import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

// Get all scripts
export async function GET(request: NextRequest) {
  try {
    const client = await clientPromise
    const db = client.db('dev-console')
    const scripts = await db.collection('deploy_history').find({}).toArray()

    return NextResponse.json({ scripts }, { status: 200 })
  } catch (error) {
    console.error('Error fetching scripts:', error)
    return NextResponse.json({ error: '获取脚本失败' }, { status: 500 })
  }
}

// Create a new script
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const { name, scriptPath } = data

    if (!name || !scriptPath) {
      return NextResponse.json({ error: '名称和脚本路径是必填项' }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db('dev-console')

    const script = {
      name,
      scriptPath,
      executionHistory: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection('deploy_history').insertOne(script)

    return NextResponse.json(
      {
        message: '脚本添加成功',
        script: {
          ...script,
          _id: result.insertedId,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating script:', error)
    return NextResponse.json({ error: '添加脚本失败' }, { status: 500 })
  }
}

// Update a script
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json()
    const { _id, name, scriptPath } = data

    if (!_id || !name || !scriptPath) {
      return NextResponse.json({ error: 'ID、名称和脚本路径是必填项' }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db('dev-console')

    const updatedScript = {
      name,
      scriptPath,
      updatedAt: new Date(),
    }

    await db
      .collection('scripts')
      .updateOne({ _id: new ObjectId(_id.toString()) }, { $set: updatedScript })

    return NextResponse.json(
      {
        message: '脚本更新成功',
        script: {
          ...updatedScript,
          _id,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error updating script:', error)
    return NextResponse.json({ error: '更新脚本失败' }, { status: 500 })
  }
}

// Delete a script
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID是必填项' }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db('dev-console')

    await db.collection('deploy_history').deleteOne({ _id: new ObjectId(id.toString()) })

    return NextResponse.json({ message: '脚本删除成功' }, { status: 200 })
  } catch (error) {
    console.error('Error deleting script:', error)
    return NextResponse.json({ error: '删除脚本失败' }, { status: 500 })
  }
}
