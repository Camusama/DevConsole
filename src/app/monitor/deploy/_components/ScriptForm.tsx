'use client'

import { KeyboardEvent, useState, useEffect, useCallback } from 'react'
import { Save, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet'
import { Script } from '../_utils/api'

interface ScriptFormProps {
  currentScript: Script
  setCurrentScript: (script: Script) => void
  saveScript: () => void
  editMode: boolean
  isSaving: boolean
}

// Form field component
const FormField = ({
  label,
  id,
  children,
}: {
  label: string
  id: string
  children: React.ReactNode
}) => {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      {children}
    </div>
  )
}

export default function ScriptForm({
  currentScript,
  setCurrentScript,
  saveScript,
  editMode,
  isSaving,
}: ScriptFormProps) {
  // Handle keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Save on Ctrl+S or Cmd+S
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        if (!isSaving) {
          saveScript()
        }
      }
    },
    [saveScript, isSaving]
  )

  // Add event listener for keyboard shortcuts
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown])

  return (
    <>
      <SheetHeader>
        <SheetTitle>{editMode ? '编辑脚本' : '添加新脚本'}</SheetTitle>
        <SheetDescription>{editMode ? '修改脚本信息' : '填写新脚本的详细信息'}</SheetDescription>
      </SheetHeader>
      <div className=" space-y-4 p-4">
        <FormField label="名称" id="name">
          <Input
            id="name"
            value={currentScript.name}
            onChange={e => setCurrentScript({ ...currentScript, name: e.target.value })}
            onKeyDown={handleKeyDown}
            placeholder="脚本名称"
          />
        </FormField>
        <FormField label="脚本路径" id="scriptPath">
          <Input
            id="scriptPath"
            value={currentScript.scriptPath}
            onChange={e => setCurrentScript({ ...currentScript, scriptPath: e.target.value })}
            onKeyDown={handleKeyDown}
            placeholder="/path/to/your/script.sh"
          />
        </FormField>
      </div>
      <SheetFooter>
        <SheetClose asChild>
          <Button variant="outline">取消</Button>
        </SheetClose>
        <Button onClick={saveScript} disabled={isSaving}>
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
      </SheetFooter>
    </>
  )
}
