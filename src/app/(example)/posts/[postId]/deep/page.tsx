import { fetchPost } from '@/utils/posts'
import Link from 'next/link'

export default async function PostComponent({ params }: { params: Promise<{ postId: string }> }) {
  const { postId } = await params

  const post = await fetchPost({ data: postId })

  return (
    <div className="p-2 space-y-2">
      <Link href="/posts" className="block py-1 text-blue-800 hover:text-blue-600">
        ← All Posts
      </Link>
      <h4 className="text-xl font-bold underline">{post.title}</h4>
      <div className="text-sm">{post.body}</div>
    </div>
  )
}
