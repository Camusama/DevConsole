import type { User } from '@/utils/users'
import { DEPLOY_URL } from '@/utils/users'

const fetchUser = async (userId: string) => {
  try {
    const res = await fetch(DEPLOY_URL + '/api/users/' + userId)

    if (!res.ok) {
      throw new Error('Unexpected status code')
    }

    const data = (await res.json()) as User

    return data
  } catch (e) {
    throw e
  }
}
export default async function UserComponent({ params }) {
  const { userId } = await params
  const user = await fetchUser(userId)

  return (
    <div className="space-y-2">
      <h4 className="text-xl font-bold underline">{user.name}</h4>
      <div className="text-sm">{user.email}</div>
    </div>
  )
}
