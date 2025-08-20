"use client"

export function SongSkeleton() {
  return (
    <div className="flex items-center gap-4 p-2 animate-pulse">
      <div className="w-15 h-15 bg-zinc-700 rounded-lg" />
      <div className="flex-1">
        <div className="h-5 bg-zinc-700 rounded mb-2 w-3/4" />
        <div className="h-4 bg-zinc-700 rounded w-1/2" />
      </div>
      <div className="w-6 h-6 bg-zinc-700 rounded" />
    </div>
  )
}

export function PlaylistCardSkeleton() {
  return (
    <div className="flex-shrink-0 w-48 animate-pulse">
      <div className="w-full h-48 bg-zinc-700 rounded-lg mb-3" />
      <div className="h-5 bg-zinc-700 rounded mb-2" />
      <div className="h-4 bg-zinc-700 rounded w-3/4" />
    </div>
  )
}

export function ErrorMessage({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="text-center py-8">
      <p className="text-red-400 mb-4">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-yellow-400 text-black rounded-lg hover:bg-yellow-500 transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  )
}
