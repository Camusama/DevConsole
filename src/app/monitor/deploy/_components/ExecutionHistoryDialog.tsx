'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Script, ExecutionRecord } from '../_utils/api'
import { formatDate } from '@/lib/utils'
import { CheckCircle, XCircle } from 'lucide-react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

interface ExecutionHistoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  script: Script | null
}

export default function ExecutionHistoryDialog({
  open,
  onOpenChange,
  script,
}: ExecutionHistoryDialogProps) {
  if (!script) return null

  // Sort execution history by timestamp (newest first)
  const sortedHistory = [...(script.executionHistory || [])].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>执行历史: {script.name}</DialogTitle>
          <DialogDescription>脚本路径: {script.scriptPath}</DialogDescription>
        </DialogHeader>

        {sortedHistory.length === 0 ? (
          <div className="py-6 text-center text-muted-foreground">
            暂无执行记录
          </div>
        ) : (
          <Accordion type="single" collapsible className="w-full">
            {sortedHistory.map((record, index) => (
              <ExecutionRecordItem key={index} record={record} index={index} />
            ))}
          </Accordion>
        )}

        <div className="flex justify-end mt-4">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            关闭
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Component for a single execution record
function ExecutionRecordItem({ record, index }: { record: ExecutionRecord; index: number }) {
  const isSuccess = record.exitCode === 0
  const statusIcon = isSuccess ? (
    <CheckCircle className="h-5 w-5 text-green-600" />
  ) : (
    <XCircle className="h-5 w-5 text-red-600" />
  )
  const statusText = isSuccess ? '成功' : '失败'

  return (
    <AccordionItem value={`item-${index}`}>
      <AccordionTrigger className="hover:no-underline">
        <div className="flex items-center gap-2 text-left">
          <div className="flex items-center gap-2">
            {statusIcon}
            <span className={isSuccess ? 'text-green-600' : 'text-red-600'}>
              {statusText}
            </span>
          </div>
          <span className="text-muted-foreground ml-2">
            {formatDate(new Date(record.timestamp))}
          </span>
          <span className="text-muted-foreground ml-2">
            退出代码: {record.exitCode}
          </span>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="space-y-4 p-2">
          {record.output && (
            <div>
              <h4 className="text-sm font-medium mb-1">输出:</h4>
              <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto whitespace-pre-wrap">
                {record.output}
              </pre>
            </div>
          )}
          {record.error && (
            <div>
              <h4 className="text-sm font-medium mb-1 text-red-600">错误:</h4>
              <pre className="bg-red-50 dark:bg-red-950/20 p-3 rounded-md text-xs overflow-x-auto whitespace-pre-wrap">
                {record.error}
              </pre>
            </div>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  )
}
