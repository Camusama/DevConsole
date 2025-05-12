'use client'

import { useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import useSWR from 'swr'
import { Note } from '@/lib/notionClient'
import { fetchNotes, createNote, updateNote, deleteNote } from './_utils/api'
import NoteCard from './_components/NoteCard'
import NoteEditor from './_components/NoteEditor'
import DeleteConfirmDialog from './_components/DeleteConfirmDialog'

export default function NotesPage() {
  // State for the note editor
  const [editorOpen, setEditorOpen] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [currentNote, setCurrentNote] = useState<Note>({
    id: '',
    title: '',
    content: '',
    createdAt: '',
    updatedAt: '',
  })

  // State for search
  const [searchTerm, setSearchTerm] = useState('')

  // State for delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [noteToDelete, setNoteToDelete] = useState<string>('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [deletingTitle, setDeletingTitle] = useState('')

  // Fetch notes with SWR
  const {
    data: notes = [],
    isLoading,
    mutate: refreshNotes,
  } = useSWR<Note[]>('/api/notes', fetchNotes, {
    revalidateOnFocus: false,
    dedupingInterval: 10000, // 10 seconds
  })

  // Filter notes based on search term
  const filteredNotes = notes.filter(
    note =>
      note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.content.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Handle creating a new note
  const handleNewNote = () => {
    setCurrentNote({
      id: '',
      title: '',
      content: '',
      createdAt: '',
      updatedAt: '',
    })
    setEditMode(false)
    setEditorOpen(true)
  }

  // Handle editing a note
  const handleEditNote = (note: Note) => {
    setCurrentNote(note)
    setEditMode(true)
    setEditorOpen(true)
  }

  // Handle saving a note (create or update)
  const handleSaveNote = async () => {
    try {
      if (!currentNote.title.trim()) {
        toast.error('笔记标题不能为空')
        return
      }

      if (editMode) {
        // Update existing note
        await updateNote(currentNote.id, currentNote.title, currentNote.content)
        toast.success('笔记更新成功')
      } else {
        // Create new note
        await createNote(currentNote.title, currentNote.content)
        toast.success('笔记创建成功')
      }

      // Close the editor and refresh the notes list
      setEditorOpen(false)
      refreshNotes()
    } catch (error) {
      console.error('Error saving note:', error)
      toast.error(error instanceof Error ? error.message : '保存笔记失败')
    }
  }

  // Handle deleting a note
  const handleDeleteNote = (id: string) => {
    const note = notes.find(n => n.id === id)
    if (note) {
      setNoteToDelete(id)
      setDeletingTitle(note.title)
      setDeleteDialogOpen(true)
    }
  }

  // Confirm note deletion
  const confirmDeleteNote = async () => {
    try {
      setIsDeleting(true)
      await deleteNote(noteToDelete)
      toast.success('笔记删除成功')
      refreshNotes()
    } catch (error) {
      console.error('Error deleting note:', error)
      toast.error(error instanceof Error ? error.message : '删除笔记失败')
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
      setNoteToDelete('')
    }
  }

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <h1 className="text-2xl font-bold">笔记本</h1>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索笔记..."
              className="pl-9 w-full"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <Button className="w-full sm:w-auto" onClick={handleNewNote}>
            <Plus className="mr-2 h-4 w-4" /> 新建笔记
          </Button>
        </div>
      </div>

      {isLoading ? (
        // Loading skeleton
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="h-40 rounded-lg border bg-card animate-pulse" />
          ))}
        </div>
      ) : filteredNotes.length > 0 ? (
        // Notes grid
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredNotes.map(note => (
            <NoteCard
              key={note.id}
              note={note}
              onEdit={handleEditNote}
              onDelete={handleDeleteNote}
            />
          ))}
        </div>
      ) : (
        // Empty state
        <div className="text-center py-12">
          <h3 className="text-lg font-medium">未找到笔记</h3>
          <p className="text-muted-foreground mt-1">
            {searchTerm ? '没有匹配的搜索结果' : '开始创建您的第一个笔记吧！'}
          </p>
          {!searchTerm && (
            <Button className="mt-4" onClick={handleNewNote}>
              <Plus className="mr-2 h-4 w-4" /> 新建笔记
            </Button>
          )}
        </div>
      )}

      {/* Note Editor */}
      <NoteEditor
        isOpen={editorOpen}
        onOpenChange={setEditorOpen}
        currentNote={currentNote}
        setCurrentNote={setCurrentNote}
        saveNote={handleSaveNote}
        editMode={editMode}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={deletingTitle}
        onConfirm={confirmDeleteNote}
        isDeleting={isDeleting}
      />
    </div>
  )
}
