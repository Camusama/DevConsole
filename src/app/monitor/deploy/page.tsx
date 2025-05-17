'use client'

import { useState } from 'react'
import { Plus, Search, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import useSWR from 'swr'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'

import ScriptCard from './_components/ScriptCard'
import ScriptForm from './_components/ScriptForm'
import ExecutionHistoryDialog from './_components/ExecutionHistoryDialog'
import {
  Script,
  fetchScripts,
  addScript,
  updateScript,
  deleteScript,
  executeScript,
} from './_utils/api'

// Default script template
const getDefaultScript = (): Script => ({
  name: '',
  scriptPath: '',
  executionHistory: [],
})

export default function DeployPage() {
  // State for script form
  const [currentScript, setCurrentScript] = useState<Script>(getDefaultScript())
  const [editMode, setEditMode] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // State for execution history dialog
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false)
  const [selectedScript, setSelectedScript] = useState<Script | null>(null)

  // Fetch scripts with SWR
  const {
    data: scripts = [],
    isLoading,
    mutate: refreshScripts,
  } = useSWR<Script[]>('/api/deploy', fetchScripts, {
    revalidateOnFocus: false,
  })

  // Filter scripts based on search term
  const filteredScripts = scripts.filter(
    script =>
      script.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      script.scriptPath.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Handle sheet open/close
  const onSheetOpenChange = (open: boolean) => {
    setSheetOpen(open)
    if (!open) {
      // Reset form when closing
      setCurrentScript(getDefaultScript())
      setEditMode(false)
    }
  }

  // Handle script save
  const handleSaveScript = async () => {
    if (!currentScript.name || !currentScript.scriptPath) {
      toast.error('名称和脚本路径是必填项')
      return
    }

    setIsSaving(true)

    try {
      if (editMode && currentScript._id) {
        // Update existing script
        await updateScript({
          _id: currentScript._id,
          name: currentScript.name,
          scriptPath: currentScript.scriptPath,
        })
        toast.success('脚本更新成功')
      } else {
        // Add new script
        await addScript({
          name: currentScript.name,
          scriptPath: currentScript.scriptPath,
        })
        toast.success('脚本添加成功')
      }

      // Reset form and close sheet
      setCurrentScript(getDefaultScript())
      setEditMode(false)
      setSheetOpen(false)
      refreshScripts() // Refresh data
    } catch (error) {
      toast.error(`${error instanceof Error ? error.message : '操作失败'}`)
    } finally {
      setIsSaving(false)
    }
  }

  // Handle script edit
  const handleEditScript = (script: Script) => {
    setCurrentScript(script)
    setEditMode(true)
    setSheetOpen(true)
  }

  // Handle script delete
  const handleDeleteScript = async (id: string) => {
    if (!id) return

    if (!confirm('确定要删除此脚本吗？此操作无法撤销。')) {
      return
    }

    try {
      await deleteScript(id)
      toast.success('脚本删除成功')
      refreshScripts() // Refresh data
    } catch (error) {
      toast.error(`删除失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  // Handle script execution
  const handleExecuteScript = async (script: Script) => {
    if (!script._id) return

    try {
      await executeScript(script._id, script.scriptPath)
      toast.success('脚本执行成功')
      refreshScripts() // Refresh data to get updated execution history
    } catch (error) {
      toast.error(`执行失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  // Handle view execution history
  const handleViewHistory = (script: Script) => {
    setSelectedScript(script)
    setHistoryDialogOpen(true)
  }

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <h1 className="text-2xl font-bold">脚本部署</h1>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索脚本..."
              className="pl-9 w-full"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => refreshScripts()}
            className="h-9 w-9"
            title="刷新"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Sheet open={sheetOpen} onOpenChange={onSheetOpenChange}>
            <SheetTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" /> 添加脚本
              </Button>
            </SheetTrigger>
            <SheetContent>
              <ScriptForm
                currentScript={currentScript}
                setCurrentScript={setCurrentScript}
                saveScript={handleSaveScript}
                editMode={editMode}
                isSaving={isSaving}
              />
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {isLoading ? (
        // Loading skeleton
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="border rounded-lg p-4">
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-full mb-4" />
              <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-1/4" />
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-8 rounded-md" />
                  <Skeleton className="h-8 w-8 rounded-md" />
                  <Skeleton className="h-8 w-8 rounded-md" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredScripts.length > 0 ? (
        // Script cards
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredScripts.map(script => (
            <ScriptCard
              key={script._id}
              script={script}
              onEdit={handleEditScript}
              onDelete={handleDeleteScript}
              onExecute={handleExecuteScript}
              onViewHistory={handleViewHistory}
            />
          ))}
        </div>
      ) : (
        // Empty state
        <div className="text-center py-12">
          <h3 className="text-lg font-medium">未找到脚本</h3>
          <p className="text-muted-foreground mt-1">
            {searchTerm ? '没有匹配的搜索结果' : '开始添加您的第一个脚本吧！'}
          </p>
          {!searchTerm && (
            <Button className="mt-4" onClick={() => setSheetOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> 添加脚本
            </Button>
          )}
        </div>
      )}

      {/* Execution History Dialog */}
      <ExecutionHistoryDialog
        open={historyDialogOpen}
        onOpenChange={setHistoryDialogOpen}
        script={selectedScript}
      />
    </div>
  )
}
