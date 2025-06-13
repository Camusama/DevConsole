import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { useChatbotStore } from '../store'
import { getPromptConfigForRoute, isPromptConfigDifferent } from '../prompts'

/**
 * 监听路由变化并自动更新 chatbot 配置的 Hook
 */
export function useRoutePrompts() {
  const pathname = usePathname()
  const { setConfig } = useChatbotStore()
  const previousPathnameRef = useRef<string>('')

  useEffect(() => {
    const currentPathname = pathname
    const previousPathname = previousPathnameRef.current

    if (!previousPathname || currentPathname !== previousPathname) {
      if (!previousPathname || isPromptConfigDifferent(previousPathname, currentPathname)) {
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
  }, [pathname, setConfig])

  return {
    currentRoute: pathname,
    previousRoute: previousPathnameRef.current,
  }
}
