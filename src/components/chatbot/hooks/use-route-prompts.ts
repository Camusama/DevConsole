import { useEffect, useRef } from 'react'
import { useLocation } from '@tanstack/react-router'
import { useChatbotStore } from '../store'
import { getPromptConfigForRoute, isPromptConfigDifferent } from '../prompts'

/**
 * 监听路由变化并自动更新 chatbot 配置的 Hook
 */
export function useRoutePrompts() {
  const location = useLocation()
  const { setConfig } = useChatbotStore()
  const previousPathnameRef = useRef<string>('')

  useEffect(() => {
    const currentPathname = location.pathname
    const previousPathname = previousPathnameRef.current

    if (!previousPathname || currentPathname !== previousPathname) {
      if (
        !previousPathname ||
        isPromptConfigDifferent(previousPathname, currentPathname)
      ) {
        const newConfig = getPromptConfigForRoute(currentPathname)

        setConfig({
          title: newConfig.title,
          placeholder: newConfig.placeholder,
          suggestionTags: newConfig.suggestionTags,
          initialPrompt: newConfig.initialPrompt,
        })
      }

      previousPathnameRef.current = currentPathname
    }
  }, [location.pathname, setConfig])

  return {
    currentRoute: location.pathname,
    previousRoute: previousPathnameRef.current,
  }
}
