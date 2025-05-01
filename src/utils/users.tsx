import { fetchWithAuth } from './fetchConfig'

export type User = {
  id: number
  name: string
  email: string
}

export const fetchUsers = async () => {
  const res = await fetchWithAuth(`/api/users`)

  if (!res.ok) {
    throw new Error('Failed to fetch users')
  }

  const data = (await res.json()) as Array<User>

  return data
}
export const fetchUser = async (userId: string) => {
  const res = await fetchWithAuth(`/api/users/${userId}`)

  if (!res.ok) {
    throw new Error('Failed to fetch single user')
  }

  const data = (await res.json()) as User

  return data
}
