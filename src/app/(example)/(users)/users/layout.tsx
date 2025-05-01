// 'use client'
import Link from 'next/link'
import { fetchUsers } from '@/utils/users'
export const dynamic = 'force-dynamic'
// import useSWR from 'swr'

export default async function UsersLayoutComponent({ children }: { children: React.ReactNode }) {
  // const { data: users } = useSWR('/fetch/users', fetchUsers)
  // 改为服务端请求， 示例为同一个函数在服务端和客户端都可以使用  [userId]/page.tsx 为客户端请求
  const users = await fetchUsers()
  return (
    <div className="p-2 flex gap-2">
      <ul className="list-disc pl-4">
        {[...(users || []), { id: 'i-do-not-exist', name: 'Non-existent User', email: '' }].map(
          user => {
            return (
              <li key={user.id} className="whitespace-nowrap">
                <Link
                  href={{
                    pathname: `/users/${user.id}`,
                    query: {
                      userId: String(user.id),
                    },
                  }}
                  className="block py-1 text-blue-800 hover:text-blue-600"
                >
                  <div>{user.name}</div>
                </Link>
              </li>
            )
          }
        )}
      </ul>
      <hr />
      {children}
    </div>
  )
}
