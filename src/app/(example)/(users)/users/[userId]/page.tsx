'use client'
import { fetchUser } from '@/utils/users'
import useSWR from 'swr'
import { useParams } from 'next/navigation'

export default function UserComponent() {
  const params = useParams()
  const userId = params.userId as string
  const { data: user, isLoading, error } = useSWR(`/users/user/${userId}`, () => fetchUser(userId))
  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>
  return (
    <div className="space-y-2">
      <h4 className="text-xl font-bold underline">{user?.name}</h4>
      <div className="text-sm">{user?.email}</div>
    </div>
  )
}
