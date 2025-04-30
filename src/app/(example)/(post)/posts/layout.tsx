import { fetchPosts } from '@/utils/posts'
import Link from 'next/link'

export const dynamic = 'force-dynamic'
export default async function PostsLayoutComponent({ children }: { children: React.ReactNode }) {
  const posts = await fetchPosts()

  return (
    <div className="p-2 flex gap-2">
      <ul className="list-disc pl-4">
        <h2>posts/layout.tsx</h2>
        {[...posts.slice(0, 10), { id: 'i-do-not-exist', title: 'Non-existent Post' }].map(post => {
          return (
            <li key={post.id} className="whitespace-nowrap">
              <Link
                href={{
                  pathname: `/posts/${post.id}`,
                  query: {
                    postId: post.id,
                  },
                }}
                className="block py-1 text-blue-800 hover:text-blue-600"
              >
                <div>{post.title.substring(0, 20)}</div>
              </Link>
            </li>
          )
        })}
      </ul>

      {children}
    </div>
  )
}
