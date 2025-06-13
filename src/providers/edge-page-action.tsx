'use client'
import React, { useEffect, useCallback } from 'react'
import { useChatbotStore } from '@/components/chatbot/store'
import { usePathname } from 'next/navigation'

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

// Edge Sync State 配置 - 更新为 WebSocket 模式
const EDGE_SYNC_CONFIG = {
  serverUrl: process.env.NEXT_PUBLIC_EDGE_PAGE_ACTION_URL || 'ws://localhost:8787',
  reconnectInterval: 5000,
  heartbeatInterval: 30000,
  maxReconnectAttempts: 10,
  stateUpdateThrottle: 1000,
  wsProtocol: 'ws', // WebSocket 协议
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

// WebSocket 消息接口
interface WSMessage {
  type: 'action' | 'ping' | 'pong' | 'connected' | 'error' | 'state_sync'
  data?: FrontendAction | PageState | Record<string, unknown>
  timestamp: number
  chatbotId?: string
}

class EdgeSyncStateManager {
  private websocket: WebSocket | null = null
  private chatbotId = ''
  private reconnectAttempts = 0
  private reconnectTimer: NodeJS.Timeout | null = null
  private stateUpdateTimer: NodeJS.Timeout | null = null
  private heartbeatTimer: NodeJS.Timeout | null = null
  private isConnected = false
  private lastStateUpdate = 0

  constructor() {
    this.setupPageStateCollection()
    this.setupVisibilityHandlers()
  }

  // 初始化连接
  public initialize(chatbotId: string) {
    if (this.chatbotId !== chatbotId) {
      logger.log(`Edge Sync State: 切换 ChatBot ID ${this.chatbotId} -> ${chatbotId}`)
      this.chatbotId = chatbotId
      this.disconnect()
      this.connect()
    } else if (!this.isConnected && this.chatbotId) {
      // 如果 ID 相同但未连接，尝试重新连接
      this.connect()
    }
  }

  // 建立 WebSocket 连接
  private connect() {
    if (!this.chatbotId || this.websocket) {
      return
    }

    try {
      // 构建 WebSocket URL
      const wsUrl = EDGE_SYNC_CONFIG.serverUrl.replace(/^http/, 'ws')
      const url = `${wsUrl}/ws/${this.chatbotId}`

      this.websocket = new WebSocket(url)

      this.websocket.onopen = () => {
        logger.log('🔗 Edge Sync State: WebSocket 连接已建立')
        this.isConnected = true
        this.reconnectAttempts = 0
        this.startHeartbeat()
        this.syncCurrentPageState()
      }

      this.websocket.onmessage = event => {
        try {
          const message: WSMessage = JSON.parse(event.data)
          this.handleWSMessage(message)
        } catch (error) {
          logger.error('Edge Sync State: 解析 WebSocket 消息失败', error)
        }
      }

      this.websocket.onclose = () => {
        logger.warn('Edge Sync State: WebSocket 连接关闭')
        this.isConnected = false
        this.stopHeartbeat()
        this.scheduleReconnect()
      }

      this.websocket.onerror = error => {
        logger.error('Edge Sync State: WebSocket 连接错误', error)
        this.isConnected = false
        this.stopHeartbeat()
      }
    } catch (error) {
      logger.error('Edge Sync State: 建立连接失败', error)
      this.scheduleReconnect()
    }
  }

  // 断开连接
  private disconnect() {
    if (this.websocket) {
      this.websocket.close()
      this.websocket = null
    }
    this.isConnected = false
    this.stopHeartbeat()

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
  }

  // 计划重连
  private scheduleReconnect() {
    if (this.reconnectAttempts >= EDGE_SYNC_CONFIG.maxReconnectAttempts) {
      logger.error('Edge Sync State: 达到最大重连次数，停止重连')
      return
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
    }

    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++
      logger.log(
        `Edge Sync State: 尝试重连 (${this.reconnectAttempts}/${EDGE_SYNC_CONFIG.maxReconnectAttempts})`
      )
      this.connect()
    }, EDGE_SYNC_CONFIG.reconnectInterval)
  }

  // 启动心跳
  private startHeartbeat() {
    this.stopHeartbeat()
    this.heartbeatTimer = setInterval(() => {
      if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
        const pingMessage: WSMessage = {
          type: 'ping',
          timestamp: Date.now(),
          chatbotId: this.chatbotId,
        }
        this.websocket.send(JSON.stringify(pingMessage))
      }
    }, EDGE_SYNC_CONFIG.heartbeatInterval)
  }

  // 停止心跳
  private stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }

  // 处理 WebSocket 消息
  private handleWSMessage(message: WSMessage) {
    switch (message.type) {
      case 'action':
        if (message.data && typeof message.data === 'object' && 'type' in message.data) {
          this.handleFrontendAction(message.data as FrontendAction)
        }
        break
      case 'ping':
        // 收到 ping，回复 pong
        if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
          const pongMessage: WSMessage = {
            type: 'pong',
            timestamp: Date.now(),
            chatbotId: this.chatbotId,
          }
          this.websocket.send(JSON.stringify(pongMessage))
        }
        break
      case 'pong':
        // 心跳响应，无需处理
        break
      case 'connected':
        logger.log('Edge Sync State: 连接确认', message.data)
        break
      case 'error':
        logger.error('Edge Sync State: 服务器错误', message.data)
        break
      default:
        logger.log('Edge Sync State: 未知消息类型', message)
    }
  }

  // 处理前端 Action
  private handleFrontendAction(action: FrontendAction) {
    logger.log('Edge Sync State: 收到 Action', action)

    try {
      switch (action.type) {
        case 'navigate':
          {
            // 支持两种格式：target 字段或 payload.url 字段
            const navigationUrl = action.target || action.payload?.url
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

  // 优化的导航处理
  private handleNavigation(url: string) {
    try {
      // 检查是否为相对路径或同域名
      const currentOrigin = window.location.origin
      const targetUrl = new URL(url, currentOrigin)

      if (targetUrl.origin === currentOrigin) {
        // 同域名使用 pushState 进行 SPA 导航
        window.history.pushState(null, '', targetUrl.pathname + targetUrl.search + targetUrl.hash)
        // 触发 popstate 事件以通知 React Router
        window.dispatchEvent(new PopStateEvent('popstate'))
      } else {
        // 跨域使用传统导航
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

  // 同步页面状态到服务器 (通过 WebSocket)
  private async syncPageState(state?: PageState) {
    if (
      !this.isConnected ||
      !this.chatbotId ||
      !this.websocket ||
      this.websocket.readyState !== WebSocket.OPEN
    ) {
      return
    }

    const currentTime = Date.now()
    if (currentTime - this.lastStateUpdate < EDGE_SYNC_CONFIG.stateUpdateThrottle) {
      return // 节流
    }

    try {
      const pageState = state || this.collectPageState()

      const message: WSMessage = {
        type: 'state_sync',
        data: pageState,
        timestamp: currentTime,
        chatbotId: this.chatbotId,
      }

      this.websocket.send(JSON.stringify(message))
      this.lastStateUpdate = currentTime
      logger.log('Edge Sync State: 页面状态已同步')
    } catch (error) {
      logger.error('Edge Sync State: 同步页面状态错误', error)
    }
  }

  // 立即同步当前页面状态
  public syncCurrentPageState() {
    this.syncPageState()
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
        if (!this.isConnected && this.chatbotId) {
          this.connect()
        }
        this.syncPageState()
      } else {
        // 页面隐藏时同步状态
        this.syncPageState()
      }
    })

    // 页面卸载前同步状态
    window.addEventListener('beforeunload', () => {
      if (this.isConnected && this.websocket && this.websocket.readyState === WebSocket.OPEN) {
        // 通过 WebSocket 发送最后的状态更新
        const state = this.collectPageState()
        const message: WSMessage = {
          type: 'state_sync',
          data: state,
          timestamp: Date.now(),
          chatbotId: this.chatbotId,
        }
        this.websocket.send(JSON.stringify(message))
      }
    })
  }

  // 销毁管理器
  public destroy() {
    this.disconnect()

    if (this.stateUpdateTimer) {
      clearTimeout(this.stateUpdateTimer)
    }

    this.stopHeartbeat()
  }
}

// 全局管理器实例
const edgeSyncManager = new EdgeSyncStateManager()

// Provider 组件
export const EdgeSyncStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname()
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
