import { Skeleton } from "@/components/ui/skeleton"
import { Loader2 } from "lucide-react"

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] w-full">
      <div className="flex items-center gap-2 mb-2">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground/50" />
        <span className="text-sm text-muted-foreground/50">Loading</span>
      </div>
      <div className="w-full max-w-3xl space-y-2 px-4">
        <div className="h-8 w-48">
          <Skeleton className="h-full w-full" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-32 rounded-lg">
              <Skeleton className="h-full w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
