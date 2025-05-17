'use client'

import { useState } from 'react'
import { Edit, Trash2, Play, History, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Script } from '../_utils/api'
import { formatDate } from '@/lib/utils'

interface ScriptCardProps {
  script: Script
  onEdit: (script: Script) => void
  onDelete: (id: string) => void
  onExecute: (script: Script) => Promise<void>
  onViewHistory: (script: Script) => void
}

export default function ScriptCard({
  script,
  onEdit,
  onDelete,
  onExecute,
  onViewHistory,
}: ScriptCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isExecuting, setIsExecuting] = useState(false)

  // Handle script execution
  const handleExecute = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isExecuting) return

    setIsExecuting(true)
    try {
      await onExecute(script)
    } finally {
      setIsExecuting(false)
    }
  }

  // Get the last execution record if available
  const lastExecution =
    script.executionHistory && script.executionHistory.length > 0
      ? script.executionHistory[script.executionHistory.length - 1]
      : null

  // Format the execution status
  const getExecutionStatus = () => {
    if (!lastExecution) return null

    const exitCode = lastExecution.exitCode
    const statusColor = exitCode === 0 ? 'text-green-600' : 'text-red-600'
    const statusText = exitCode === 0 ? '成功' : '失败'

    return (
      <span className={statusColor}>
        上次执行: {statusText} ({formatDate(new Date(lastExecution.timestamp))})
      </span>
    )
  }

  return (
    <Card
      className="h-full flex flex-col transition-shadow hover:shadow-md cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onEdit(script)}
    >
      <CardContent className="flex flex-col flex-grow p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-medium line-clamp-1">{script.name}</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-2 line-clamp-1">
          {script.scriptPath.startsWith('http')
            ? new URL(script.scriptPath).pathname
            : script.scriptPath}
        </p>
        <div className="mt-auto text-xs text-muted-foreground">
          {getExecutionStatus() || <span>未执行</span>}
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-between items-center">
        <span className="text-xs text-muted-foreground">
          {formatDate(new Date(script.updatedAt || script.createdAt || ''))}
        </span>
        <div className={`flex gap-2 transition-opacity ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={e => {
                    e.stopPropagation()
                    onViewHistory(script)
                  }}
                >
                  <History className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>查看执行历史</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={handleExecute}
                  disabled={isExecuting}
                >
                  {isExecuting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>执行脚本</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={e => {
                    e.stopPropagation()
                    onEdit(script)
                  }}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>编辑脚本</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={e => {
                    e.stopPropagation()
                    onDelete(script._id || '')
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>删除脚本</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardFooter>
    </Card>
  )
}
