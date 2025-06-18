'use server'

import { revalidatePath } from 'next/cache'

// Edge Sync State 配置
const EDGE_SYNC_CONFIG = {
  serverUrl: process.env.EDGE_PAGE_ACTION_URL || 'http://localhost:8787',
}

// 页面状态接口
interface PageState {
  url: string
  title: string
  timestamp: number
  chatbotId?: string
  inputs?: Record<string, string | boolean>
  forms?: Record<string, Record<string, FormDataEntryValue>>
  scrollPosition?: { x: number; y: number }
  viewport?: { width: number; height: number }
  metadata?: Record<string, string>
  customData?: Record<string, unknown>
}

// Action 接口
interface FrontendAction {
  type: 'navigate' | 'click' | 'input' | 'scroll' | 'custom'
  target?: string
  payload?: Record<string, unknown>
  timestamp: number
}

// API 响应接口
interface ApiResponse {
  success: boolean
  data?: {
    chatbotId: string
    actions: FrontendAction[]
    polled: boolean
    timestamp: number
  }
  error?: string
  timestamp: number
}

// 获取认证头
function getAuthHeaders() {
  return {
    'Authorization': `Bearer ${process.env.EDGE_PAGE_SYNC_KEY}`,
    'Content-Type': 'application/json',
  }
}

// 检查队列中的 Actions（Server Action）
export async function checkQueuedActions(chatbotId: string): Promise<ApiResponse> {
  try {
    const response = await fetch(
      `${EDGE_SYNC_CONFIG.serverUrl}/api/action/${chatbotId}/poll`,
      {
        headers: getAuthHeaders(),
      }
    )
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const result: ApiResponse = await response.json()
    return result
  } catch (error) {
    console.error('Edge Sync State: 轮询请求失败', error)
    throw error
  }
}

// 同步页面状态到服务器（Server Action）
export async function syncPageState(chatbotId: string, pageState: PageState): Promise<boolean> {
  try {
    const response = await fetch(`${EDGE_SYNC_CONFIG.serverUrl}/api/state/${chatbotId}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(pageState),
    })
    
    if (!response.ok) {
      console.warn('Edge Sync State: 状态同步失败', response.status, response.statusText)
      return false
    }
    
    console.log('Edge Sync State: 页面状态已同步成功')
    return true
  } catch (error) {
    console.error('Edge Sync State: 同步页面状态错误', error)
    return false
  }
}

// 页面卸载前同步状态（Server Action）
export async function syncPageStateOnUnload(chatbotId: string, pageState: PageState): Promise<boolean> {
  try {
    const response = await fetch(`${EDGE_SYNC_CONFIG.serverUrl}/api/state/${chatbotId}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(pageState),
    })
    
    return response.ok
  } catch (error) {
    console.error('Edge Sync State: 页面卸载前同步状态失败', error)
    return false
  }
}