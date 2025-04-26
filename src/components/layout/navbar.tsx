import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Globe, PanelsTopLeft } from 'lucide-react'

export function Navbar() {
  return (
    <nav className="border-b h-16 flex items-center px-6 justify-between bg-background">
      <div className="flex items-center gap-6">
        <Link href="/" className="flex items-center gap-2">
          <PanelsTopLeft className="h-6 w-6" />

          <span className="font-semibold">开发控制台</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/services">
            <Button variant="ghost" size="sm">
              <Globe className="h-4 w-4 mr-2" />
              服务聚合
            </Button>
          </Link>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <Link href="/settings">
          <Button variant="outline" size="sm">
            设置
          </Button>
        </Link>
      </div>
    </nav>
  )
}
