"use client"
import { useEffect, useRef, useCallback } from "react"
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { Post } from "@/lib/types"
import { PostCard } from "./post-card"
import { FeedSkeleton } from "./post-skeleton"
import { PostComposer } from "./post-composer"
import { ReplyModal } from "./reply-modal"
import { useState } from "react"

const PAGE_SIZE = 20

async function fetchPosts(userId: string, page: number): Promise<Post[]> {
  const supabase = createClient()
  const { data, error } = await supabase.rpc("get_posts", {
    p_user_id: userId,
    p_limit: PAGE_SIZE,
    p_offset: page * PAGE_SIZE,
  })
  if (error) throw error
  return (data ?? []).map((row: any) => ({
    id: row.id,
    user_id: row.user_id,
    content: row.content,
    image_url: row.image_url,
    parent_id: row.parent_id,
    created_at: row.created_at,
    likes_count: Number(row.likes_count),
    comments_count: Number(row.comments_count),
    liked_by_user: row.liked_by_user,
    profiles: {
      id: row.user_id,
      username: row.profile_username,
      display_name: row.profile_display_name ?? null,
      bio: row.profile_bio,
      avatar_url: row.profile_avatar_url,
      cover_photo_url: null,
      website: null,
      location: null,
      created_at: row.created_at,
    },
  }))
}

interface FeedProps {
  userId: string
  username: string
}

export function Feed({ userId, username }: FeedProps) {
  const [replyToId, setReplyToId] = useState<string | null>(null)
  const queryClient = useQueryClient()
  const loaderRef = useRef<HTMLDivElement>(null)

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteQuery({
    queryKey: ["posts", userId],
    queryFn: ({ pageParam = 0 }) => fetchPosts(userId, pageParam as number),
    getNextPageParam: (lastPage, pages) =>
      lastPage.length === PAGE_SIZE ? pages.length : undefined,
    initialPageParam: 0,
  })

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["posts", userId] })
  }, [queryClient, userId])

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    const el = loaderRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage() },
      { threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const posts = data?.pages.flat() ?? []

  return (
    <div>
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border px-4 py-3">
        <h1 className="font-bold text-xl">Home</h1>
      </div>

      <PostComposer userId={userId} username={username} onPost={invalidate} />

      {isLoading && <FeedSkeleton />}

      {posts.map(post => (
        <PostCard
          key={post.id}
          post={post}
          currentUserId={userId}
          onReply={setReplyToId}
        />
      ))}

      <div ref={loaderRef} className="py-4 flex justify-center">
        {isFetchingNextPage && (
          <div className="h-6 w-6 rounded-full border-2 border-sky-500 border-t-transparent animate-spin" />
        )}
        {!hasNextPage && posts.length > 0 && (
          <p className="text-sm text-muted-foreground">You're all caught up!</p>
        )}
      </div>

      {replyToId && (
        <ReplyModal
          postId={replyToId}
          userId={userId}
          username={username}
          onClose={() => setReplyToId(null)}
          onReply={invalidate}
        />
      )}
    </div>
  )
}
