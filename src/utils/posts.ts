export type PostType = {
  id: string
  title: string
  body: string
}
export const fetchPosts = async () => {
  console.info('Fetching posts...')
  const res = await fetch('https://jsonplaceholder.typicode.com/posts')
  if (!res.ok) {
    throw new Error('Failed to fetch posts')
  }

  const posts = (await res.json()) as Array<PostType>

  return posts
}
export const fetchPost = async ({ data }: { data: string }) => {
  console.info(`Fetching post with id ${data}...`)
  const res = await fetch(`https://jsonplaceholder.typicode.com/posts/${data}`)
  if (!res.ok) {
    if (res.status === 404) {
      throw 'not found'
    }

    throw new Error('Failed to fetch post')
  }

  const post = (await res.json()) as PostType

  return post
}
