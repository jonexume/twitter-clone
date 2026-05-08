export function PostSkeleton() {
  return (
    <div className="flex gap-3 px-4 py-3 border-b border-border animate-pulse">
      <div className="h-10 w-10 rounded-full bg-muted shrink-0" />
      <div className="flex-1 space-y-2.5 pt-1">
        <div className="flex gap-2">
          <div className="h-3 w-24 rounded-full bg-muted" />
          <div className="h-3 w-16 rounded-full bg-muted opacity-60" />
        </div>
        <div className="h-3 w-full rounded-full bg-muted" />
        <div className="h-3 w-4/5 rounded-full bg-muted" />
        <div className="h-3 w-2/3 rounded-full bg-muted opacity-60" />
      </div>
    </div>
  )
}

export function FeedSkeleton() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => <PostSkeleton key={i} />)}
    </>
  )
}
