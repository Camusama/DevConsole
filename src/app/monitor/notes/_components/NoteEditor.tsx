'use client'

import { useState, useEffect } from 'react'
import { Save, X } from 'lucide-react'
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
  // SimpleMDE options
  const [editorOptions] = useState({
    autofocus: true,
    spellChecker: false,
    placeholder: '在这里输入笔记内容...',
    status: ['lines', 'words', 'cursor'],
    toolbar: [
      'bold', 'italic', 'heading', '|',
      'quote', 'unordered-list', 'ordered-list', '|',
      'link', 'image', '|',
      'preview', 'side-by-side', 'fullscreen', '|',
      'guide'
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

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-3xl md:max-w-4xl overflow-y-auto" side="right">
        <SheetHeader>
          <SheetTitle>{editMode ? '编辑笔记' : '新建笔记'}</SheetTitle>
          <SheetDescription>
            {editMode ? '修改笔记内容' : '创建一个新的笔记'}
          </SheetDescription>
        </SheetHeader>
        
        <div className="mt-6 space-y-4">
          <div>
            <Input
              value={currentNote.title}
              onChange={handleTitleChange}
              placeholder="笔记标题"
              className="text-lg font-medium"
            />
          </div>
          
          <div className="h-[calc(100vh-250px)]">
            <SimpleMDE
              value={currentNote.content}
              onChange={handleContentChange}
              options={editorOptions}
            />
          </div>
        </div>
        
        <SheetFooter className="mt-4">
          <SheetClose asChild>
            <Button variant="outline">
              <X className="mr-2 h-4 w-4" />
              取消
            </Button>
          </SheetClose>
          <Button onClick={saveNote}>
            <Save className="mr-2 h-4 w-4" />
            {editMode ? '更新' : '保存'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
