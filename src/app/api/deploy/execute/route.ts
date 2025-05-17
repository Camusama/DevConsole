import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { fetchWithClerk } from '@/utils/fetchConfig'

// Execute a script
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const { scriptId, scriptPath } = data

    if (!scriptId || !scriptPath) {
      return NextResponse.json({ error: '脚本ID和路径是必填项' }, { status: 400 })
    }

    // Execute the script using SERVER_PY_ENDPOINT
    const response = await fetchWithClerk(`${process.env.SERVER_PY_ENDPOINT}/run_sh/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        script_path: scriptPath,
      }),
    })

    if (!response.ok) {
      throw new Error(`执行脚本失败: ${response.statusText}`)
    }

    const result = await response.json()

    // Create execution history record
    const executionRecord = {
      timestamp: new Date(),
      output: result.output || '',
      error: result.error || '',
      exitCode: result.exit_code,
    }

    // Update script with execution history
    const client = await clientPromise
    const db = client.db('dev-console')

    await db.collection('deploy_history').updateOne(
      { _id: new ObjectId(scriptId) },
      {
        $push: {
          executionHistory: {
            $each: [executionRecord],
            $slice: -5, // Keep only the last 10 execution records
          },
        },
      }
    )

    return NextResponse.json({
      message: '脚本执行成功',
      execution: executionRecord,
    })
  } catch (error) {
    console.error('Error executing script:', error)
    return NextResponse.json(
      { error: `执行脚本失败: ${error instanceof Error ? error.message : '未知错误'}` },
      { status: 500 }
    )
  }
}
