'use client'
import { getEsxiList } from '@/lib/esxiClient'
import { DataTable } from './_components/data-table'
import { columns } from './_components/columns'
import useSWR from 'swr'
import { useEffect, useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { RefreshCw, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { ESXI_CACHE_KEY as CACHE_KEY } from '@/lib/constants'
import { Vm } from './_components/columns'

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
  // 搜索状态
  const [searchTerm, setSearchTerm] = useState<string>('')

  const { isLoading, data, isValidating, mutate } = useSWR(CACHE_KEY, getEsxiList, {
    revalidateOnFocus: false,
    onSuccess: data => {
      // 成功获取数据后，将数据和时间戳存入localStorage
      if (
        data?.isSuccess &&
        typeof window !== 'undefined' &&
        Array.isArray(data?.data) &&
        data?.data?.length > 0
      ) {
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
  }, [data, isValidating])

  // 手动刷新数据
  const handleRefresh = () => {
    mutate()
  }

  // 过滤虚拟机数据
  const filteredData = useMemo(() => {
    let targetSource: any[] = data?.data
    if (!data?.data || !Array.isArray(data?.data) || !data.isSuccess) {
      targetSource = getLocalCache()?.data?.data || []
    }

    if (!searchTerm.trim()) return targetSource

    const term = searchTerm.toLowerCase()
    return targetSource.filter((vm: Vm) => {
      return (
        vm.name.toLowerCase().includes(term) ||
        vm.os.toLowerCase().includes(term) ||
        vm.host.toLowerCase().includes(term)
      )
    })
  }, [data, searchTerm])

  // 加载状态
  if (isLoading && !getLocalCache()?.data) {
    return (
      <div className="container mx-auto p-4 max-w-7xl">
        <h1 className="text-2xl font-bold mb-4">ESXi 虚拟机管理</h1>

        <div className="w-full max-w-md h-10 bg-gray-200 animate-pulse rounded-md mb-4"></div>

        <div className="h-16 bg-gray-200 animate-pulse rounded-md mb-4"></div>

        <div className="rounded-md border">
          <div className="h-[400px] w-full bg-gray-100 animate-pulse"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">ESXi 虚拟机管理</h1>
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索虚拟机..."
            className="pl-9 w-full"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="flex justify-between items-center mb-4 p-3 bg-gray-50 rounded-md">
        <div className="flex flex-col">
          <div className="text-sm text-gray-500">
            {cacheTime ? `上次更新时间: ${cacheTime}` : '无缓存数据'}
          </div>
          <div className="text-xs text-gray-400">
            {isValidating
              ? '正在更新数据...'
              : cacheTime &&
                new Date().getTime() - new Date(cacheTime).getTime() > 2 * 60 * 60 * 1000
              ? '使用缓存数据'
              : '数据已是最新'}
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

      {filteredData.length > 0 ? (
        <DataTable columns={columns} data={filteredData} />
      ) : (
        <div className="text-center py-12 border rounded-md">
          <h3 className="text-lg font-medium">未找到虚拟机</h3>
          <p className="text-muted-foreground mt-1">
            {searchTerm ? '没有匹配的搜索结果' : '暂无虚拟机数据'}
          </p>
        </div>
      )}
    </div>
  )
}
