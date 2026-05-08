export function PostSkeleton() {
  return (
    <div className="flex gap-3 p-4 border-b border-border animate-pulse">
      <div className="h-10 w-10 rounded-full bg-muted shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-32 rounded bg-muted" />
        <div className="h-3 w-full rounded bg-muted" />
        <div className="h-3 w-3/4 rounded bg-muted" />
      </div>
    </div>
  )
}

export function FeedSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => <PostSkeleton key={i} />)}
    </>
  )
}
