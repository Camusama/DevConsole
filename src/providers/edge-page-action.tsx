'use client'
import React, { useEffect, useCallback } from 'react'
import { useChatbotStore } from '@/components/chatbot/store'
import { usePathname, useRouter } from 'next/navigation'

// 开发环境日志工具
const isDev = true

const logger = {
  // eslint-disable-next-line no-console
  log: (...args: unknown[]) => isDev && console.log(...args),
  // eslint-disable-next-line no-console
  warn: (...args: unknown[]) => isDev && console.warn(...args),
  // eslint-disable-next-line no-console
  error: (...args: unknown[]) => isDev && console.error(...args),
}

// Edge Sync State 配置 - 纯 RESTful API + 轮询模式
const EDGE_SYNC_CONFIG = {
  serverUrl: process.env.NEXT_PUBLIC_EDGE_PAGE_ACTION_URL || 'http://localhost:8787',
  stateUpdateThrottle: 1000,
  // 轮询配置
  pollingInterval: 2000, // 2秒轮询一次
  enablePolling: true, // 启用轮询模式
  maxPollingRetries: 5, // 最大轮询重试次数
  // 状态同步配置
  stateSyncInterval: 5000, // 5秒同步一次状态
  enableStateSync: true, // 启用状态同步
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

// WebSocket 消息接口已移除，现在使用纯 RESTful API

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

class EdgeSyncStateManager {
  private chatbotId = ''
  private router: any = null
  private lastStateUpdate = 0

  // 轮询相关属性
  private pollingTimer: NodeJS.Timeout | null = null
  private isPollingEnabled = false
  private pollingRetries = 0
  private pollingCount = 0

  // 状态同步相关属性
  private stateSyncTimer: NodeJS.Timeout | null = null
  private isStateSyncEnabled = false

  constructor() {
    this.setupPageStateCollection()
    this.setupVisibilityHandlers()
  }

  // 设置 Next.js router 实例
  public setRouter(router: any) {
    this.router = router
  }

  // 初始化服务
  public initialize(chatbotId: string) {
    if (this.chatbotId !== chatbotId) {
      logger.log(`Edge Sync State: 切换 ChatBot ID ${this.chatbotId} -> ${chatbotId}`)
      this.chatbotId = chatbotId
      this.stop()
      this.start()
    } else if (this.chatbotId && !this.isPollingEnabled) {
      // 如果 ID 相同但服务未启动，启动服务
      this.start()
    }
  }

  // 启动服务
  private start() {
    if (!this.chatbotId) {
      return
    }

    logger.log(`🚀 Edge Sync State: 启动服务 for ${this.chatbotId}`)

    // 启动 Action 轮询
    if (EDGE_SYNC_CONFIG.enablePolling) {
      this.startActionPolling()
    }

    // 启动状态同步
    if (EDGE_SYNC_CONFIG.enableStateSync) {
      this.startStateSync()
    }

    // 立即同步一次当前页面状态
    this.syncCurrentPageState()
  }

  // 停止服务
  private stop() {
    logger.log('🛑 Edge Sync State: 停止服务')
    this.stopActionPolling()
    this.stopStateSync()
  }

  // 销毁服务
  public destroy() {
    this.stop()
    this.chatbotId = ''
  }

  // 启动 Action 轮询
  private startActionPolling() {
    if (this.isPollingEnabled || !this.chatbotId) {
      return
    }

    this.isPollingEnabled = true
    this.pollingRetries = 0
    this.pollingCount = 0

    logger.log('🔄 Edge Sync State: 启动 Action 轮询')

    this.pollingTimer = setInterval(async () => {
      try {
        this.pollingCount++
        await this.checkQueuedActions()
      } catch (error) {
        logger.error('Edge Sync State: 轮询错误', error)
        this.pollingRetries++

        if (this.pollingRetries >= EDGE_SYNC_CONFIG.maxPollingRetries) {
          logger.error('Edge Sync State: 轮询重试次数过多，停止轮询')
          this.stopActionPolling()
        }
      }
    }, EDGE_SYNC_CONFIG.pollingInterval)
  }

  // 停止 Action 轮询
  private stopActionPolling() {
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer)
      this.pollingTimer = null
    }
    this.isPollingEnabled = false
    logger.log('🛑 Edge Sync State: 停止 Action 轮询')
  }

  // 启动状态同步
  private startStateSync() {
    if (this.isStateSyncEnabled || !this.chatbotId) {
      return
    }

    this.isStateSyncEnabled = true
    logger.log('🔄 Edge Sync State: 启动状态同步')

    this.stateSyncTimer = setInterval(async () => {
      try {
        await this.syncCurrentPageState()
      } catch (error) {
        logger.error('Edge Sync State: 状态同步错误', error)
      }
    }, EDGE_SYNC_CONFIG.stateSyncInterval)
  }

  // 停止状态同步
  private stopStateSync() {
    if (this.stateSyncTimer) {
      clearInterval(this.stateSyncTimer)
      this.stateSyncTimer = null
    }
    this.isStateSyncEnabled = false
    logger.log('🛑 Edge Sync State: 停止状态同步')
  }

  // 检查队列中的 Actions（单次检查）
  private async checkQueuedActions() {
    if (!this.chatbotId) {
      return
    }

    try {
      const response = await fetch(
        `${EDGE_SYNC_CONFIG.serverUrl}/api/action/${this.chatbotId}/poll`
      )
      const result: ApiResponse = await response.json()

      if (result.success && result.data && result.data.actions) {
        const actions = result.data.actions

        if (actions.length > 0) {
          logger.log(`📨 Edge Sync State: 从队列中获取到 ${actions.length} 个 Action`)

          actions.forEach(action => {
            logger.log(`🎯 Edge Sync State: 队列中的 Action: ${action.type}`)
            this.handleFrontendAction(action)
          })

          // 重置重试计数
          this.pollingRetries = 0
        }
      } else if (!result.success) {
        logger.warn('Edge Sync State: 轮询失败', result.error)
      }
    } catch (error) {
      logger.error('Edge Sync State: 轮询请求失败', error)
      throw error
    }
  }

  // WebSocket 消息处理已移除，现在使用纯 RESTful API

  // 处理前端 Action
  private handleFrontendAction(action: FrontendAction) {
    logger.log('Edge Sync State: 收到 Action', action)

    try {
      switch (action.type) {
        case 'navigate':
          {
            // 支持两种格式：target 字段或 payload.url 字段
            const navigationUrl = action.payload?.url || action.target
            if (navigationUrl && typeof navigationUrl === 'string') {
              // 使用 React Router 风格的导航（如果可用）或原生导航
              this.handleNavigation(navigationUrl)
            } else {
              logger.warn('Edge Sync State: navigate action  URL', action)
            }
          }
          break
        case 'click':
          if (action.target) {
            this.handleElementClick(action.target)
          }
          break
        case 'input':
          if (action.target && action.payload?.value && typeof action.payload.value === 'string') {
            this.handleInputChange(action.target, action.payload.value)
          }
          break
        case 'scroll':
          if (action.payload) {
            this.handleScroll(action.payload)
          }
          break
        case 'custom':
          // 触发自定义事件
          window.dispatchEvent(new CustomEvent('edge-sync-action', { detail: action }))
          break
      }
    } catch (error) {
      logger.error('Edge Sync State: 执行 Action 失败', error)
    }
  }

  // 优化的导航处理 - 使用 Next.js 原生导航
  private handleNavigation(url: string) {
    try {
      logger.log(`🧭 Edge Sync State: 导航到 ${url}`)

      // 检查是否为相对路径或同域名
      const currentOrigin = window.location.origin
      const targetUrl = new URL(url, currentOrigin)

      if (targetUrl.origin === currentOrigin) {
        // 同域名使用 Next.js router 进行导航
        const navigationPath = targetUrl.pathname + targetUrl.search + targetUrl.hash
        logger.log(`🔄 Edge Sync State: 使用 Next.js router 导航到 ${navigationPath}`)

        if (this.router && typeof this.router.push === 'function') {
          // 使用 Next.js router.push 进行导航
          this.router.push(navigationPath)
        } else {
          // 如果 router 不可用，回退到 window.location
          logger.warn('Edge Sync State: Next.js router 不可用，使用 window.location 导航')
          window.location.href = url
        }
      } else {
        // 跨域使用传统导航
        logger.log(`🌐 Edge Sync State: 使用传统导航到 ${url}`)
        window.location.href = url
      }
    } catch (error) {
      // 如果 URL 解析失败，回退到传统导航
      logger.warn('Edge Sync State: URL 解析失败，使用传统导航', error)
      window.location.href = url
    }
  }

  // 优化的元素点击处理
  private handleElementClick(target: string) {
    const element = document.querySelector(target)
    if (element && element instanceof HTMLElement) {
      // 使用 React 合成事件风格的点击
      const clickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window,
      })
      element.dispatchEvent(clickEvent)
    }
  }

  // 优化的输入处理
  private handleInputChange(target: string, value: string) {
    const element = document.querySelector(target)
    if (element && element instanceof HTMLInputElement) {
      // 设置值并触发 React 风格的事件
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        'value'
      )?.set

      if (nativeInputValueSetter) {
        nativeInputValueSetter.call(element, value)
      } else {
        element.value = value
      }

      // 触发 React 能识别的事件
      element.dispatchEvent(new Event('input', { bubbles: true }))
      element.dispatchEvent(new Event('change', { bubbles: true }))
    }
  }

  // 优化的滚动处理
  private handleScroll(payload: Record<string, unknown>) {
    const x = typeof payload.x === 'number' ? payload.x : 0
    const y = typeof payload.y === 'number' ? payload.y : 0

    // 使用平滑滚动
    window.scrollTo({
      left: x,
      top: y,
      behavior: 'smooth',
    })
  }

  // 收集当前页面状态（优化性能）
  private collectPageState(): PageState {
    // 使用 requestIdleCallback 优化性能（如果可用）
    const collectData = () => {
      const inputs: Record<string, string | boolean> = {}
      const forms: Record<string, Record<string, FormDataEntryValue>> = {}

      // 优化的输入框收集 - 使用更高效的选择器
      const inputElements = document.querySelectorAll('input, textarea, select')
      for (let i = 0; i < inputElements.length; i++) {
        const element = inputElements[i] as
          | HTMLInputElement
          | HTMLTextAreaElement
          | HTMLSelectElement

        const key = element.id || element.name || `input_${i}`

        if (
          element instanceof HTMLInputElement &&
          (element.type === 'checkbox' || element.type === 'radio')
        ) {
          inputs[key] = element.checked
        } else {
          inputs[key] = element.value
        }
      }

      // 优化的表单数据收集
      const formElements = document.querySelectorAll('form')
      for (let i = 0; i < formElements.length; i++) {
        const form = formElements[i]
        try {
          const formData = new FormData(form)
          const formKey = form.id || form.name || `form_${i}`
          forms[formKey] = Object.fromEntries(formData.entries())
        } catch (error) {
          logger.warn('Edge Sync State: 收集表单数据失败', error)
        }
      }

      return { inputs, forms }
    }

    const { inputs, forms } = collectData()

    // 获取 chatbot 相关数据
    const chatbotStore = useChatbotStore.getState()

    return {
      url: window.location.href,
      title: document.title,
      timestamp: Date.now(),
      chatbotId: this.chatbotId,
      inputs,
      forms,
      scrollPosition: {
        x: window.scrollX,
        y: window.scrollY,
      },
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      metadata: {
        userAgent: navigator.userAgent,
        language: navigator.language,
        referrer: document.referrer,
      },
      customData: {
        chatbotOpen: chatbotStore.isOpen,
        chatbotMessages: chatbotStore.messages.length,
        conversationId: chatbotStore.conversationId,
        lastActivity: Date.now(),
      },
    }
  }

  // 同步页面状态到服务器 (通过 RESTful API)
  private async syncPageState(state?: PageState) {
    if (!this.chatbotId) {
      return
    }

    const currentTime = Date.now()
    if (currentTime - this.lastStateUpdate < EDGE_SYNC_CONFIG.stateUpdateThrottle) {
      return // 节流
    }

    try {
      const pageState = state || this.collectPageState()

      const response = await fetch(`${EDGE_SYNC_CONFIG.serverUrl}/api/state/${this.chatbotId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pageState),
      })

      if (response.ok) {
        this.lastStateUpdate = currentTime
        logger.log('Edge Sync State: 页面状态已同步')
      } else {
        logger.warn('Edge Sync State: 状态同步失败', response.status, response.statusText)
      }
    } catch (error) {
      logger.error('Edge Sync State: 同步页面状态错误', error)
    }
  }

  // 立即同步当前页面状态
  public async syncCurrentPageState() {
    await this.syncPageState()
  }

  // 设置页面状态收集
  private setupPageStateCollection() {
    // 监听页面变化事件（移除 scroll 避免过度同步）
    const events = ['input', 'change', 'click', 'resize', 'focus', 'blur']

    // 使用节流函数优化事件处理
    const throttledSync = this.createThrottledFunction(
      () => this.syncPageState(),
      EDGE_SYNC_CONFIG.stateUpdateThrottle
    )

    events.forEach(eventType => {
      document.addEventListener(eventType, throttledSync, { passive: true })
    })

    // 优化的路由变化监听
    this.setupRouteChangeDetection()
  }

  // 创建节流函数
  private createThrottledFunction<T extends (...args: unknown[]) => void>(
    func: T,
    delay: number
  ): T {
    let timeoutId: NodeJS.Timeout | null = null

    return ((...args: Parameters<T>) => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }

      timeoutId = setTimeout(() => {
        func(...args)
        timeoutId = null
      }, delay)
    }) as T
  }

  // 优化的路由变化检测
  private setupRouteChangeDetection() {
    // 保存原始方法的引用
    const originalPushState = window.history.pushState.bind(window.history)
    const originalReplaceState = window.history.replaceState.bind(window.history)

    // 重写 pushState
    window.history.pushState = (data: unknown, unused: string, url?: string | URL | null) => {
      originalPushState(data, unused, url)
      // 使用 requestAnimationFrame 确保 DOM 更新后再同步
      requestAnimationFrame(() => {
        this.syncPageState()
      })
    }

    // 重写 replaceState
    window.history.replaceState = (data: unknown, unused: string, url?: string | URL | null) => {
      originalReplaceState(data, unused, url)
      requestAnimationFrame(() => {
        this.syncPageState()
      })
    }

    // 监听 popstate 事件（浏览器前进/后退）
    window.addEventListener('popstate', () => {
      requestAnimationFrame(() => {
        this.syncPageState()
      })
    })

    // 监听 hashchange 事件
    window.addEventListener('hashchange', () => {
      requestAnimationFrame(() => {
        this.syncPageState()
      })
    })
  }

  // 设置页面可见性处理
  private setupVisibilityHandlers() {
    // 页面可见性变化
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        if (!this.isPollingEnabled && this.chatbotId) {
          this.start()
        }
        this.syncPageState()
      } else {
        // 页面隐藏时同步状态
        this.syncPageState()
      }
    })

    // 页面卸载前同步状态
    window.addEventListener('beforeunload', () => {
      if (this.chatbotId) {
        // 通过 RESTful API 发送最后的状态更新
        const state = this.collectPageState()
        // 使用 sendBeacon 确保在页面卸载时能发送请求
        const data = JSON.stringify(state)
        navigator.sendBeacon(`${EDGE_SYNC_CONFIG.serverUrl}/api/state/${this.chatbotId}`, data)
      }
    })
  }

  // 销毁管理器（移除重复实现）
}

// 全局管理器实例
const edgeSyncManager = new EdgeSyncStateManager()

// Provider 组件
export const EdgeSyncStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname()
  const router = useRouter()
  const chatbotId = useChatbotStore(state => state.chatbotId)
  const isOpen = useChatbotStore(state => state.isOpen)
  const messages = useChatbotStore(state => state.messages)
  const conversationId = useChatbotStore(state => state.conversationId)

  // 检查当前路由是否为认证路由 (基于 middleware.ts 的 isAuthRoute 逻辑)
  const isAuthRoute = pathname.startsWith('/monitor') || pathname.startsWith('/api')

  // 使用 useCallback 优化事件处理函数
  const handleCustomAction = useCallback((event: CustomEvent) => {
    logger.log('Edge Sync State: 自定义 Action 事件', event.detail)
    // 可以在这里处理自定义 Action
  }, [])

  // 使用 useCallback 优化状态同步函数
  const syncState = useCallback(() => {
    edgeSyncManager.syncCurrentPageState()
  }, [])

  // 设置 router 实例
  useEffect(() => {
    edgeSyncManager.setRouter(router)
  }, [router])

  // 初始化连接 - 只在认证路由时启用
  useEffect(() => {
    if (isAuthRoute && chatbotId) {
      logger.log('Edge Sync State: 在认证路由中初始化连接', { pathname, chatbotId })
      edgeSyncManager.initialize(chatbotId)
    } else if (!isAuthRoute) {
      logger.log('Edge Sync State: 非认证路由，断开连接', { pathname })
      edgeSyncManager.destroy()
    }

    return () => {
      // 组件卸载时不销毁管理器，保持连接
    }
  }, [isAuthRoute, chatbotId, pathname])

  // 监听 chatbot 状态变化，触发状态同步（使用 useCallback 优化）- 只在认证路由时执行
  useEffect(() => {
    if (isAuthRoute) {
      syncState()
    }
  }, [isAuthRoute, isOpen, messages.length, conversationId, syncState])

  // 监听自定义 Action 事件（使用 useCallback 优化）- 只在认证路由时启用
  useEffect(() => {
    if (isAuthRoute) {
      window.addEventListener('edge-sync-action', handleCustomAction as EventListener)

      return () => {
        window.removeEventListener('edge-sync-action', handleCustomAction as EventListener)
      }
    }
  }, [isAuthRoute, handleCustomAction])

  return <>{children}</>
}

// 导出管理器实例供外部使用（如果需要）
export { edgeSyncManager }
