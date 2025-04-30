export default function Page() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <h1 className="text-4xl font-bold">Dev Console</h1>
      <p className="text-sm text-muted-foreground">
        Version: {process.env.NEXT_PUBLIC_APP_VERSION || 'development'}
      </p>
    </div>
  )
}
