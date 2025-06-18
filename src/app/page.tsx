import redis from "@/lib/upstash-redis";
import { EyeIcon } from "lucide-react";
export default async function Page() {
  await redis.incr("view");
	const view = await redis.get("view") as number
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8">
      <h1 className="text-4xl font-bold mb-8">Dev Console</h1>
      <div className="grid gap-3 text-sm text-muted-foreground w-full max-w-xs">
        <div className="flex justify-between">
          <span className="font-medium">Version:</span>
          <span>{process.env.VERCEL_GIT_COMMIT_MESSAGE || 'local'}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-medium">Commit:</span>
          <span>{process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || 'local'}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-medium">Branch:</span>
          <span>{process.env.VERCEL_GIT_COMMIT_REF || 'local'}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-medium">Build Time:</span>
          <span>
            {new Date(process.env.NEXT_PUBLIC_BUILD_TIME || '').toLocaleString('zh-CN', {
              timeZone: 'Asia/Shanghai',
            })}
          </span>
        </div>
      </div>
      <div className="flex items-center justify-center space-x-2 rounded-xl  from-white to-gray-50 px-6 py-3 text-sm text-gray-600 ring-1 ring-gray-100/80 transition-all  hover:ring-gray-200/80">
          <EyeIcon className="h-4 w-4 text-gray-500" />
          <div className="flex items-baseline space-x-1">
            <span className="hidden sm:inline-block text-gray-500">Page Views:</span>
            <span className="font-semibold text-gray-800">{view}</span>
          </div>
      </div>
    </div>
  )
}
