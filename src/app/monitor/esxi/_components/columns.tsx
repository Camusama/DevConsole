'use client'

import { powerControlVm } from '@/lib/esxiClient'
import { ColumnDef } from '@tanstack/react-table'
import { useState } from 'react'
export type Vm = {
  name: string
  power_state: string
  os: string
  cpu_count: number
  memory_mb: number
  storage_used: number
  tools_status: string
  host: string
}
import { Button } from '@/components/ui/button'
import { ChevronRight } from 'lucide-react'
export const columns: ColumnDef<Vm>[] = [
  {
    accessorKey: 'name',
    header: '虚拟机名称',
  },
  {
    accessorKey: 'power_state',
    header: '电源状态',
    cell: ({ row }) => {
      const isPoweredOn = row.original.power_state === 'poweredOn'
      return (
        <div className={`flex items-center ${isPoweredOn ? 'text-green-600' : 'text-red-600'}`}>
          {isPoweredOn ? (
            <>
              <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
              <span>运行中</span>
            </>
          ) : (
            <>
              <div className="w-2 h-2 rounded-full bg-red-500 mr-2"></div>
              <span>已关闭</span>
            </>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: 'os',
    header: '操作系统',
  },
  {
    accessorKey: 'cpu_count',
    header: 'CPU核心',
  },
  {
    accessorKey: 'memory_mb',
    header: '内存(MB)',
  },
  {
    accessorKey: 'storage_used',
    header: '存储使用(GB)',
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const [loading, setLoading] = useState<{
        power_on: boolean
        power_off: boolean
        reboot: boolean
      }>({
        power_on: false,
        power_off: false,
        reboot: false,
      })
      const [error, setError] = useState<string | null>(null)

      const handleAction = async (actionType: 'power_on' | 'power_off' | 'reboot') => {
        setLoading(prev => ({ ...prev, [actionType]: true }))
        setError(null)

        try {
          const result = await powerControlVm(row.original.name, actionType)
          if (!result.isSuccess) {
            setError(`操作失败: '未知错误'}`)
          }
        } catch (err) {
          setError(`操作失败: ${err instanceof Error ? err.message : '未知错误'}`)
        } finally {
          setLoading(prev => ({ ...prev, [actionType]: false }))
        }
      }

      return (
        <div className="flex items-center gap-2">
          <Button
            onClick={() => handleAction('power_on')}
            disabled={loading.power_on || row.original.power_state === 'poweredOn'}
            variant="secondary"
            size="sm"
          >
            {loading.power_on ? '开机中...' : '开机'}
          </Button>
          <Button
            onClick={() => handleAction('power_off')}
            disabled={loading.power_off || row.original.power_state === 'poweredOff'}
            variant="secondary"
            size="sm"
          >
            {loading.power_off ? '关机中...' : '关机'}
          </Button>
          <Button
            onClick={() => handleAction('reboot')}
            disabled={loading.reboot || row.original.power_state === 'poweredOff'}
            variant="outline"
            size="sm"
          >
            {loading.reboot ? '重启中...' : '重启'}
          </Button>
          {error && <div className="text-red-500 text-xs">{error}</div>}
        </div>
      )
    },
  },
]
