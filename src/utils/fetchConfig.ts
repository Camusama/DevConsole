'use server'
// 在 nextjs  一个方法要支持客户端和服务端同时调用需要做大量操作
export async function getBaseUrl() {
  // 客户端分支，直接返回空串,相对路径
  if (typeof window !== 'undefined') return ''
  // 服务端必须绝对路径：动态导入 next/headers，仅在 Node 环境执行
  const { headers } = await import('next/headers')
  const hdrs = await headers()
  const host = hdrs.get('x-forwarded-host') ?? hdrs.get('host')
  const proto = process.env.NODE_ENV === 'production' ? 'https' : 'http'
  return `${proto}://${host}`
}

export const fetchWithBaseUrl = async (
  ...args: Parameters<typeof fetch>
): ReturnType<typeof fetch> => {
  if (typeof window !== 'undefined') {
    // 客户端
    return fetch(...args)
  }
  //服务端
  const baseUrl = await getBaseUrl()
  return fetch(`${baseUrl}${args[0]}`, args[1])
}

export async function getAuthHeaders() {
  if (typeof window !== 'undefined') {
    return {
      Authorization: '',
    }
  }
  try {
    const { auth } = await import('@clerk/nextjs/server')
    const { getToken } = await auth()
    const token = await getToken()

    if (token) {
      return {
        Authorization: `Bearer ${token}`,
      }
    }
  } catch (error) {
    console.error('获取认证令牌失败:', error)
    return {
      Authorization: '',
    }
  }
}
// 服务端也要auth ，不会像客户端自动带，手动加上
export const fetchWithAuth = async (
  ...args: Parameters<typeof fetch>
): ReturnType<typeof fetch> => {
  if (typeof window !== 'undefined') {
    // 客户端
    return fetchWithBaseUrl(...args)
  }
  //服务端auth
  const headers = await getAuthHeaders()
  return fetchWithBaseUrl(args[0], {
    ...args[1],
    headers: {
      ...args[1]?.headers,
      ...headers,
    },
  })
}
export const fetchWithClerk = async (
  ...args: Parameters<typeof fetch>
): ReturnType<typeof fetch> => {
  if (typeof window !== 'undefined') {
    // 客户端
    return fetchWithBaseUrl(...args)
  }
  //服务端auth
  const headers = await getAuthHeaders()
  return fetch(args[0], {
    ...args[1],
    headers: {
      ...args[1]?.headers,
      ...headers,
    },
  })
}
