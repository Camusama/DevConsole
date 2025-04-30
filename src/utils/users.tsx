export type User = {
  id: number
  name: string
  email: string
}

export const DEPLOY_URL = 'http://localhost:3000'
export const fetchUsers = async () => {
  const res = await fetch(DEPLOY_URL + '/api/users')
  if (!res.ok) {
    throw new Error('Failed to fetch users')
  }

  const data = (await res.json()) as Array<User>

  return data
}
export const fetchUser = async (userId: string) => {
  const res = await fetch(DEPLOY_URL + '/api/users/' + userId)

  if (!res.ok) {
    throw new Error('Failed to fetch single user')
  }

  const data = (await res.json()) as User

  return data
}
