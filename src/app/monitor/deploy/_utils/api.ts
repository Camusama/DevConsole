// Script type definition
export type ExecutionRecord = {
  timestamp: Date
  output: string
  error: string
  exitCode: number
}

export type Script = {
  _id?: string
  name: string
  scriptPath: string
  executionHistory: ExecutionRecord[]
  createdAt?: Date
  updatedAt?: Date
}

// Fetch all scripts
export const fetchScripts = async () => {
  const response = await fetch('/api/deploy')
  if (!response.ok) {
    throw new Error('获取脚本失败')
  }
  const data = await response.json()
  return data.scripts || []
}

// Add a new script
export const addScript = async (script: Omit<Script, '_id' | 'executionHistory'>) => {
  const response = await fetch('/api/deploy', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(script),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || '添加脚本失败')
  }

  return await response.json()
}

// Update a script
export const updateScript = async (script: Pick<Script, '_id' | 'name' | 'scriptPath'>) => {
  const response = await fetch('/api/deploy', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(script),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || '更新脚本失败')
  }

  return await response.json()
}

// Delete a script
export const deleteScript = async (id: string) => {
  const response = await fetch(`/api/deploy?id=${id}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || '删除脚本失败')
  }

  return await response.json()
}

// Execute a script
export const executeScript = async (scriptId: string, scriptPath: string) => {
  const response = await fetch('/api/deploy/execute', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      scriptId,
      scriptPath,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || '执行脚本失败')
  }

  return await response.json()
}
