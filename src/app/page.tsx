export default function Page() {
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
    </div>
  )
}
