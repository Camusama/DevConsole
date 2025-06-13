export interface RoutePromptConfig {
  route: string
  title?: string
  placeholder?: string
  suggestionTags: string[]
  initialPrompt?: string
}

export interface PromptEngineConfig {
  routes: RoutePromptConfig[]
  defaultConfig: RoutePromptConfig
}

export interface RouteContext {
  pathname: string
  params?: Record<string, string>
  search?: Record<string, string>
}
