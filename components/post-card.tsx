"use client"
import { useState } from "react"
import Image from "next/image"
import { Heart, MessageCircle, Share2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Post } from "@/lib/types"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "@/lib/date"

interface PostCardProps {
  post: Post
  currentUserId?: string
  onReply?: (postId: string) => void
}

export function PostCard({ post, currentUserId, onReply }: PostCardProps) {
  const [liked, setLiked] = useState(post.liked_by_user)
  const [likesCount, setLikesCount] = useState(post.likes_count)
  const supabase = createClient()

  async function toggleLike() {
    if (!currentUserId) return
    // Optimistic update
    const wasLiked = liked
    setLiked(!wasLiked)
    setLikesCount(c => wasLiked ? c - 1 : c + 1)

    if (wasLiked) {
      const { error } = await supabase.from("likes").delete()
        .eq("post_id", post.id).eq("user_id", currentUserId)
      if (error) { setLiked(wasLiked); setLikesCount(c => wasLiked ? c + 1 : c - 1) }
    } else {
      const { error } = await supabase.from("likes").insert({ post_id: post.id, user_id: currentUserId })
      if (error) { setLiked(wasLiked); setLikesCount(c => wasLiked ? c - 1 : c + 1) }
    }
  }

  return (
    <article className="flex gap-3 p-4 border-b border-border hover:bg-muted/30 transition-colors cursor-pointer">
      <div className="h-10 w-10 rounded-full bg-sky-500 flex items-center justify-center text-white font-bold shrink-0">
        {post.profiles.username[0].toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-sm">@{post.profiles.username}</span>
          <span className="text-muted-foreground text-sm">·</span>
          <span className="text-muted-foreground text-sm">{formatDistanceToNow(post.created_at)}</span>
        </div>
        <p className="mt-1 text-sm whitespace-pre-wrap break-words">{post.content}</p>
        {post.image_url && (
          <div className="mt-3 rounded-2xl overflow-hidden">
            <Image
              src={post.image_url} alt="Post image"
              width={500} height={300}
              className="w-full object-cover max-h-80"
            />
          </div>
        )}
        <div className="flex items-center gap-6 mt-3">
          <button
            onClick={() => onReply?.(post.id)}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-sky-500 transition-colors group"
          >
            <MessageCircle className="h-4 w-4 group-hover:scale-110 transition-transform" />
            <span className="text-xs">{post.comments_count}</span>
          </button>
          <button
            onClick={toggleLike}
            className={cn(
              "flex items-center gap-1.5 transition-colors group",
              liked ? "text-pink-500" : "text-muted-foreground hover:text-pink-500"
            )}
          >
            <Heart className={cn("h-4 w-4 group-hover:scale-110 transition-transform", liked && "fill-current")} />
            <span className="text-xs">{likesCount}</span>
          </button>
          <button className="flex items-center gap-1.5 text-muted-foreground hover:text-sky-500 transition-colors group">
            <Share2 className="h-4 w-4 group-hover:scale-110 transition-transform" />
          </button>
        </div>
      </div>
    </article>
  )
}
