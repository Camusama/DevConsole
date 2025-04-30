import Link from 'next/link'

import { DEPLOY_URL } from '@/utils/users'
import type { User } from '@/utils/users'

const fetchUsers = async () => {
  try {
    const res = await fetch(DEPLOY_URL + '/api/users', {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    if (!res.ok) {
      throw new Error('Unexpected status code')
    }

    const data = (await res.json()) as Array<User>

    return data
  } catch {
    throw new Error('Failed to fetch users')
  }
}
export default async function UsersLayoutComponent({ children }: { children: React.ReactNode }) {
  const users = await fetchUsers()

  return (
    <div className="p-2 flex gap-2">
      <ul className="list-disc pl-4">
        {[...users, { id: 'i-do-not-exist', name: 'Non-existent User', email: '' }].map(user => {
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
        })}
      </ul>
      <hr />
      {children}
    </div>
  )
}
