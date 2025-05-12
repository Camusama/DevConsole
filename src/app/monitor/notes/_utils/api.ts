import { Note } from '@/lib/notionClient'

// Fetch all notes
export const fetchNotes = async () => {
  const response = await fetch('/api/notes')
  if (!response.ok) {
    throw new Error('获取笔记列表失败')
  }
  const data = await response.json()
  return data.notes || []
}

// Fetch a single note
export const fetchNote = async (id: string) => {
  const response = await fetch(`/api/notes/${id}`)
  if (!response.ok) {
    throw new Error('获取笔记详情失败')
  }
  const data = await response.json()
  return data.note
}

// Create a new note
export const createNote = async (title: string, content: string) => {
  const response = await fetch('/api/notes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title, content }),
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || '创建笔记失败')
  }
  
  return await response.json()
}

// Update an existing note
export const updateNote = async (id: string, title: string, content: string) => {
  const response = await fetch(`/api/notes/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title, content }),
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || '更新笔记失败')
  }
  
  return await response.json()
}

// Delete a note
export const deleteNote = async (id: string) => {
  const response = await fetch(`/api/notes/${id}`, {
    method: 'DELETE',
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || '删除笔记失败')
  }
  
  return await response.json()
}
