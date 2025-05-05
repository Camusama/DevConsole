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
import { VmActions } from './VmActions'
export const columns: ColumnDef<Vm>[] = [
  {
    accessorKey: 'name',
    header: '虚拟机名称',
    enableSorting: true,
  },
  {
    accessorKey: 'power_state',
    header: '电源状态',
    enableSorting: true,
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
    enableSorting: true,
  },
  {
    accessorKey: 'cpu_count',
    header: 'CPU核心',
    enableSorting: true,
  },
  {
    accessorKey: 'memory_mb',
    header: '内存(MB)',
    enableSorting: true,
  },
  {
    accessorKey: 'storage_used',
    header: '存储使用(GB)',
    enableSorting: true,
  },
  {
    id: 'actions',
    cell: ({ row }) => (
      <VmActions vmName={row.original.name} powerState={row.original.power_state} />
    ),
  },
]
