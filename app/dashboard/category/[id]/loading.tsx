export default function Loading() {
  return (
    <div className="min-h-screen pb-32">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center gap-4 p-4">
          <div className="w-10 h-10 rounded-lg bg-muted animate-pulse" />
          <div className="h-8 w-32 bg-muted animate-pulse rounded" />
        </div>
      </div>
      <div className="p-4 space-y-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-4">
            <div className="h-7 w-40 bg-muted animate-pulse rounded" />
            <div className="flex gap-4">
              {[1, 2, 3, 4].map((j) => (
                <div key={j} className="flex-shrink-0 w-40">
                  <div className="aspect-square rounded-lg bg-muted animate-pulse mb-2" />
                  <div className="h-4 w-full bg-muted animate-pulse rounded mb-1" />
                  <div className="h-3 w-24 bg-muted animate-pulse rounded" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
