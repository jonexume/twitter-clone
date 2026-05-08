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
    <article className="flex gap-3 px-4 py-3 border-b border-border hover:bg-muted/40 transition-all duration-200 cursor-pointer">
      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-white font-bold shrink-0 shadow-sm">
        {post.profiles.avatar_url ? (
          <Image src={post.profiles.avatar_url} alt={post.profiles.username} width={40} height={40} className="rounded-full object-cover" />
        ) : post.profiles.username[0].toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-semibold text-[15px] leading-tight">{post.profiles.display_name ?? post.profiles.username}</span>
          <span className="text-muted-foreground text-[15px] leading-tight">@{post.profiles.username}</span>
          <span className="text-muted-foreground text-[15px]">·</span>
          <span className="text-muted-foreground text-[15px]">{formatDistanceToNow(post.created_at)}</span>
        </div>
        <p className="mt-1 text-[15px] leading-normal whitespace-pre-wrap break-words">{post.content}</p>
        {post.image_url && (
          <div className="mt-3 rounded-2xl overflow-hidden border border-border shadow-sm">
            <Image
              src={post.image_url} alt="Post image"
              width={500} height={300}
              className="w-full object-cover max-h-96"
            />
          </div>
        )}
        <div className="flex items-center gap-8 mt-3">
          <button
            onClick={(e) => { e.stopPropagation(); onReply?.(post.id) }}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-sky-500 transition-all duration-200 group"
          >
            <div className="p-1.5 rounded-full group-hover:bg-sky-500/10 transition-all duration-200">
              <MessageCircle className="h-[18px] w-[18px] group-hover:scale-110 transition-transform duration-200" />
            </div>
            <span className="text-xs font-medium">{post.comments_count}</span>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); toggleLike() }}
            className={cn(
              "flex items-center gap-1.5 transition-all duration-200 group",
              liked ? "text-pink-500" : "text-muted-foreground hover:text-pink-500"
            )}
          >
            <div className={cn(
              "p-1.5 rounded-full transition-all duration-200",
              liked ? "bg-pink-500/10" : "group-hover:bg-pink-500/10"
            )}>
              <Heart className={cn(
                "h-[18px] w-[18px] group-hover:scale-110 transition-transform duration-200",
                liked && "fill-current"
              )} />
            </div>
            <span className="text-xs font-medium">{likesCount}</span>
          </button>
          <button className="flex items-center gap-1.5 text-muted-foreground hover:text-sky-500 transition-all duration-200 group">
            <div className="p-1.5 rounded-full group-hover:bg-sky-500/10 transition-all duration-200">
              <Share2 className="h-[18px] w-[18px] group-hover:scale-110 transition-transform duration-200" />
            </div>
          </button>
        </div>
      </div>
    </article>
  )
}
