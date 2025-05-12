'use client'

import { useState, useEffect } from 'react'
import { Save, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet'
import { Note } from '@/lib/notionClient'
import dynamic from 'next/dynamic'

// Dynamically import the SimpleMDE editor to avoid SSR issues
const SimpleMDE = dynamic(() => import('react-simplemde-editor'), { ssr: false })

// Import styles for the editor (will need to be added to the project)
import 'easymde/dist/easymde.min.css'

interface NoteEditorProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  currentNote: Note
  setCurrentNote: (note: Note) => void
  saveNote: () => void
  editMode: boolean
}

export default function NoteEditor({
  isOpen,
  onOpenChange,
  currentNote,
  setCurrentNote,
  saveNote,
  editMode,
}: NoteEditorProps) {
  // Add loading state
  const [isSaving, setIsSaving] = useState(false)

  // SimpleMDE options
  const [editorOptions] = useState<any>({
    autofocus: true,
    spellChecker: false,
    placeholder: '在这里输入笔记内容...',
    status: ['lines', 'words', 'cursor'],
    toolbar: [
      'bold',
      'italic',
      'heading',
      '|',
      'quote',
      'unordered-list',
      'ordered-list',
      '|',
      'link',
      'image',
      '|',
      'preview',
      'side-by-side',
      'fullscreen',
      '|',
      'guide',
    ],
  })

  // Handle title change
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentNote({ ...currentNote, title: e.target.value })
  }

  // Handle content change
  const handleContentChange = (value: string) => {
    setCurrentNote({ ...currentNote, content: value })
  }

  // Modify save handler to include loading state
  const handleSave = async () => {
    setIsSaving(true)
    try {
      await saveNote()
    } finally {
      setIsSaving(false)
    }
  }

  // Update keyboard shortcut handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        handleSave()
      }
    }

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, handleSave])

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-3xl md:max-w-4xl flex flex-col" side="right">
        <SheetHeader className="px-4 pt-4 flex-none">
          <SheetTitle>{editMode ? '编辑笔记' : '新建笔记'}</SheetTitle>
          <SheetDescription>{editMode ? '修改笔记内容' : '创建一个新的笔记'}</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6 px-4 flex-1 overflow-y-auto">
          <div className="space-y-2">
            <label htmlFor="note-title" className="text-sm font-medium text-gray-700">
              标题
            </label>
            <Input
              id="note-title"
              value={currentNote.title}
              onChange={handleTitleChange}
              placeholder="笔记标题"
              className="text-lg font-medium"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">内容</label>
            <div className="h-[calc(100vh-320px)] overflow-y-auto overflow-x-hidden">
              <SimpleMDE
                value={currentNote.content}
                onChange={handleContentChange}
                options={editorOptions}
              />
            </div>
          </div>
        </div>

        <SheetFooter className="px-4 py-4 border-t flex-none bg-background">
          <div className="flex items-center justify-start w-full gap-2">
            <Button onClick={handleSave} className="px-6" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  保存中...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {editMode ? '更新' : '保存'} (⌘+S/Ctrl+S)
                </>
              )}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
