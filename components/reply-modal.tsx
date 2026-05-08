"use client"
import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Post, Profile } from "@/lib/types"
import { PostComposer } from "./post-composer"
import { PostCard } from "./post-card"
import { PostSkeleton } from "./post-skeleton"

interface ReplyModalProps {
  postId: string
  userId: string
  username: string
  onClose: () => void
  onReply?: () => void
}

async function fetchPostWithMeta(supabase: ReturnType<typeof createClient>, postId: string, userId: string): Promise<Post | null> {
  const [{ data: postData }, { count: likesCount }, { data: userLike }, { count: commentsCount }] = await Promise.all([
    supabase.from("posts").select("id, user_id, content, image_url, parent_id, created_at").eq("id", postId).single(),
    supabase.from("likes").select("*", { count: "exact", head: true }).eq("post_id", postId),
    supabase.from("likes").select("user_id").eq("post_id", postId).eq("user_id", userId).maybeSingle(),
    supabase.from("posts").select("*", { count: "exact", head: true }).eq("parent_id", postId),
  ])
  if (!postData) return null

  const { data: profileData } = await supabase.from("profiles").select("*").eq("id", postData.user_id).single()
  if (!profileData) return null

  return {
    ...postData,
    profiles: profileData as Profile,
    likes_count: likesCount ?? 0,
    comments_count: commentsCount ?? 0,
    liked_by_user: !!userLike,
  }
}

export function ReplyModal({ postId, userId, username, onClose, onReply }: ReplyModalProps) {
  const [parentPost, setParentPost] = useState<Post | null>(null)
  const [replies, setReplies] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const supabase = createClient()

  useEffect(() => { setMounted(true) }, [])

  async function loadThread() {
    setLoading(true)
    const post = await fetchPostWithMeta(supabase, postId, userId)
    setParentPost(post)

    const { data: repliesData } = await supabase
      .from("posts")
      .select("id, user_id, content, image_url, parent_id, created_at")
      .eq("parent_id", postId)
      .order("created_at", { ascending: true })

    if (repliesData) {
      const enriched = await Promise.all(
        repliesData.map(r => fetchPostWithMeta(supabase, r.id, userId))
      )
      setReplies(enriched.filter(Boolean) as Post[])
    }
    setLoading(false)
  }

  useEffect(() => { loadThread() }, [postId])

  function handleReply() {
    loadThread()
    onReply?.()
  }

  const modal = (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center bg-black/60 pt-16 px-4">
      <div className="w-full max-w-xl bg-background rounded-2xl shadow-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center gap-4 p-4 border-b border-border">
          <button onClick={onClose} className="p-2 rounded-full hover:bg-muted transition-colors">
            <X className="h-5 w-5" />
          </button>
          <h2 className="font-bold text-lg">Thread</h2>
        </div>

        <div className="overflow-y-auto flex-1">
          {loading ? (
            <PostSkeleton />
          ) : parentPost ? (
            <>
              <PostCard post={parentPost} currentUserId={userId} />
              <div className="border-b border-border px-4 py-2 text-sm text-muted-foreground">
                Replying to @{parentPost.profiles.username}
              </div>
              <PostComposer userId={userId} username={username} parentId={postId} onPost={handleReply} />
              {replies.map(reply => (
                <PostCard key={reply.id} post={reply} currentUserId={userId} />
              ))}
              {replies.length === 0 && (
                <p className="text-center text-muted-foreground text-sm py-8">No replies yet. Be the first!</p>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  )

  if (!mounted) return null
  return createPortal(modal, document.body)
}
