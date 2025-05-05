'use client'

import { Button } from '@/components/ui/button'
import { mutate } from 'swr'
import { ESXI_CACHE_KEY as CACHE_KEY } from '@/lib/constants'
import { powerControlVm } from '@/lib/esxiClient'
import { useState } from 'react'

type VmActionsProps = {
  vmName: string
  powerState: string
}

export function VmActions({ vmName, powerState }: VmActionsProps) {
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
      const result = await powerControlVm(vmName, actionType)
      if (!result.isSuccess) {
        setError(`操作失败: '未知错误'}`)
      } else {
        mutate(CACHE_KEY)
      }
    } catch (err) {
      setError(`操作失败: ${err instanceof Error ? err.message : '未知错误'}`)
    } finally {
      setLoading(prev => ({ ...prev, [actionType]: false }))
    }
  }

  return (
    <div className="flex items-center gap-2 justify-end">
      <Button
        onClick={() => handleAction('power_on')}
        disabled={loading.power_on || powerState === 'poweredOn'}
        variant="outline"
        size="sm"
      >
        {loading.power_on ? '开机中...' : '开机'}
      </Button>
      <Button
        onClick={() => handleAction('power_off')}
        disabled={loading.power_off || powerState === 'poweredOff'}
        variant="outline"
        size="sm"
      >
        {loading.power_off ? '关机中...' : '关机'}
      </Button>
      <Button
        onClick={() => handleAction('reboot')}
        disabled={loading.reboot || powerState === 'poweredOff'}
        variant="outline"
        size="sm"
      >
        {loading.reboot ? '重启中...' : '重启'}
      </Button>
      {error && <div className="text-red-500 text-xs">{error}</div>}
    </div>
  )
}
