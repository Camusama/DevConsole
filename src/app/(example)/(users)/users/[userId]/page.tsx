import { fetchUser } from '@/utils/users'

export default async function UserComponent({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params
  const user = await fetchUser(userId)

  return (
    <div className="space-y-2">
      <h4 className="text-xl font-bold underline">{user.name}</h4>
      <div className="text-sm">{user.email}</div>
    </div>
  )
}
