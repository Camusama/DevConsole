import Link from 'next/link'

export default function LayoutComponent({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <div>pathlessLayout/layout.tsx nested layout</div>
      <div className="flex gap-2 border-b">
        <Link href="/route-a">Go to route A</Link>
        <Link href="/route-b">Go to route B</Link>
        <Link href="/route-c">Go to route C not exist</Link>
      </div>
      <div>{children}</div>
    </div>
  )
}
