'use client'
import { getEsxiList } from '@/lib/esxiClient'
import { DataTable } from './_components/data-table'
import { columns } from './_components/columns'
import useSWR from 'swr'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'

// 缓存键名
export const CACHE_KEY = 'esxi-data-cache'

// 从localStorage获取缓存数据
const getLocalCache = () => {
  if (typeof window === 'undefined') return null

  try {
    const cachedData = localStorage.getItem(CACHE_KEY)
    if (!cachedData) return null

    const parsed = JSON.parse(cachedData)
    return parsed
  } catch (error) {
    console.error('Failed to parse cached data:', error)
    return null
  }
}

export default function Home() {
  // 缓存时间状态
  const [cacheTime, setCacheTime] = useState<string>('')

  const { isLoading, data, error, isValidating, mutate } = useSWR(CACHE_KEY, getEsxiList, {
    revalidateOnFocus: false,
    onSuccess: data => {
      // 成功获取数据后，将数据和时间戳存入localStorage
      if (data?.isSuccess && typeof window !== 'undefined') {
        const cacheData = {
          data: data,
          timestamp: new Date().toISOString(),
        }
        localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData))
        setCacheTime(new Date().toLocaleString())
      }
    },
    fallbackData: getLocalCache()?.data,
  })

  // 初始化时从缓存中获取时间戳
  useEffect(() => {
    const cachedData = getLocalCache()
    if (cachedData?.timestamp) {
      setCacheTime(new Date(cachedData.timestamp).toLocaleString())
    }
  }, [data])

  // 手动刷新数据
  const handleRefresh = () => {
    mutate()
  }

  if (isLoading && !getLocalCache()?.data) {
    return <div>ESXi Loading...</div>
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-4 p-3 bg-gray-50 rounded-md">
        <div className="flex flex-col">
          <div className="text-sm text-gray-500">
            {cacheTime ? `上次更新时间: ${cacheTime}` : '无缓存数据'}
          </div>
          <div className="text-xs text-gray-400">
            {isValidating ? '正在更新数据...' : '数据已是最新'}
          </div>
        </div>
        <Button
          onClick={handleRefresh}
          variant="outline"
          size="sm"
          disabled={isValidating}
          className="flex items-center gap-1"
        >
          <RefreshCw className={`h-4 w-4 ${isValidating ? 'animate-spin' : ''}`} />
          刷新
        </Button>
      </div>
      <DataTable columns={columns} data={data?.data || []} />
    </div>
  )
}
