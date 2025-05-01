import { fetchWithAuth } from './fetchConfig'

export type User = {
  id: number
  name: string
  email: string
}

export const fetchUsers = async () => {
  // 双端使用
  const res = await fetchWithAuth(`/api/users`)

  if (!res.ok) {
    throw new Error('Failed to fetch users')
  }

  const data = (await res.json()) as Array<User>

  return data
}
export const fetchUser = async (userId: string) => {
  // 注意这个写法，只能在 client 端使用
  const res = await fetch(`/api/users/${userId}`)

  if (!res.ok) {
    throw new Error('Failed to fetch single user')
  }

  const data = (await res.json()) as User

  return data
}
