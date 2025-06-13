import type { RoutePromptConfig, RouteContext } from './types'
import { routeConfigs, defaultRouteConfig } from './route-configs'

/**
 * Prompt 引擎 - 根据路由上下文动态生成 chatbot 配置
 */
export class PromptEngine {
  private configs: RoutePromptConfig[]
  private defaultConfig: RoutePromptConfig

  constructor() {
    this.configs = routeConfigs
    this.defaultConfig = defaultRouteConfig
  }

  /**
   * 根据路由上下文获取匹配的配置
   */
  getConfigForRoute(context: RouteContext): RoutePromptConfig {
    const { pathname } = context
    
    // 精确匹配
    let matchedConfig = this.configs.find(config => config.route === pathname)
    
    if (!matchedConfig) {
      // 前缀匹配（用于嵌套路由）
      matchedConfig = this.configs.find(config => 
        pathname.startsWith(config.route) && config.route !== '*'
      )
    }
    
    return matchedConfig || this.defaultConfig
  }

  /**
   * 获取所有可用的路由配置
   */
  getAllConfigs(): RoutePromptConfig[] {
    return [...this.configs]
  }

  /**
   * 添加新的路由配置
   */
  addRouteConfig(config: RoutePromptConfig): void {
    const existingIndex = this.configs.findIndex(c => c.route === config.route)
    if (existingIndex >= 0) {
      this.configs[existingIndex] = config
    } else {
      this.configs.push(config)
    }
  }

  /**
   * 移除路由配置
   */
  removeRouteConfig(route: string): void {
    this.configs = this.configs.filter(c => c.route !== route)
  }

  /**
   * 更新默认配置
   */
  updateDefaultConfig(config: Partial<RoutePromptConfig>): void {
    this.defaultConfig = { ...this.defaultConfig, ...config }
  }

  /**
   * 检查路由是否有特定配置
   */
  hasConfigForRoute(pathname: string): boolean {
    return this.configs.some(config => 
      config.route === pathname || pathname.startsWith(config.route)
    )
  }

  /**
   * 获取路由的建议标签（用于动画效果）
   */
  getSuggestionTagsForRoute(pathname: string): string[] {
    const config = this.getConfigForRoute({ pathname })
    return config.suggestionTags
  }

  /**
   * 比较两个路由的配置是否不同（用于判断是否需要更新）
   */
  isConfigDifferent(pathname1: string, pathname2: string): boolean {
    const config1 = this.getConfigForRoute({ pathname: pathname1 })
    const config2 = this.getConfigForRoute({ pathname: pathname2 })
    
    return (
      config1.title !== config2.title ||
      config1.placeholder !== config2.placeholder ||
      JSON.stringify(config1.suggestionTags) !== JSON.stringify(config2.suggestionTags)
    )
  }
}

// 单例实例
export const promptEngine = new PromptEngine()

// 便捷函数
export const getPromptConfigForRoute = (pathname: string) => 
  promptEngine.getConfigForRoute({ pathname })

export const getSuggestionTagsForRoute = (pathname: string) =>
  promptEngine.getSuggestionTagsForRoute(pathname)

export const isPromptConfigDifferent = (pathname1: string, pathname2: string) =>
  promptEngine.isConfigDifferent(pathname1, pathname2)
