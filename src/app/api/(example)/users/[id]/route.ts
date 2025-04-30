import type { User } from '@/utils/users'

export async function GET(request: Request, { params }) {
  const { id } = await params
  console.info(`Fetching users by id=${id}... @`, request.url)
  try {
    const res = await fetch('https://jsonplaceholder.typicode.com/users/' + id)
    if (!res.ok) {
      throw new Error('Failed to fetch user')
    }

    const user = (await res.json()) as User

    return Response.json({
      id: user.id,
      name: user.name,
      email: user.email,
    })
  } catch (e) {
    console.error(e)
    return Response.json({ error: 'User not found' }, { status: 404 })
  }
}
