import { fetchPost } from '@/utils/posts'
import Link from 'next/link'

export default async function PostComponent({ params }: { params: Promise<{ postId: string }> }) {
  const { postId } = await params
  const post = await fetchPost({ data: postId })

  return (
    <div className="space-y-2">
      posts/[postID]/page.tsx
      <h4 className="text-xl font-bold underline">{post.title}</h4>
      <div className="text-sm">{post.body}</div>
      <Link
        href={{
          pathname: `/posts/${post.id}/deep`,
          query: {
            postId: post.id,
          },
        }}
        className="block py-1 text-blue-800 hover:text-blue-600"
      >
        Deep View
      </Link>
    </div>
  )
}
