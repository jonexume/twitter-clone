"use client"
import { useEffect, useState, useCallback } from "react"
import Image from "next/image"
import { ArrowLeft, MapPin, Link as LinkIcon, Calendar, Camera } from "lucide-react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Profile, Post } from "@/lib/types"
import { PostCard } from "@/components/post-card"
import { FeedSkeleton } from "@/components/post-skeleton"
import { EditProfileModal } from "@/components/edit-profile-modal"
import { FollowModal } from "@/components/follow-modal"
import { formatDistanceToNow } from "@/lib/date"

type Tab = "posts" | "replies" | "likes"

interface ProfileViewProps {
  username: string
  currentUserId: string
}

export function ProfileView({ username, currentUserId }: ProfileViewProps) {
  const router = useRouter()
  const supabase = createClient()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [tab, setTab] = useState<Tab>("posts")
  const [loading, setLoading] = useState(true)
  const [isFollowing, setIsFollowing] = useState(false)
  const [followerCount, setFollowerCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)
  const [showEdit, setShowEdit] = useState(false)
  const [followModal, setFollowModal] = useState<"followers" | "following" | null>(null)
  const isOwn = profile?.id === currentUserId

  const loadProfile = useCallback(async () => {
    const { data } = await supabase.from("profiles").select("*").eq("username", username).single()
    if (!data) return
    setProfile(data as Profile)

    const [{ count: fc }, { count: fgc }, { data: followCheck }] = await Promise.all([
      supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", data.id),
      supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", data.id),
      supabase.from("follows").select("follower_id").eq("follower_id", currentUserId).eq("following_id", data.id).maybeSingle(),
    ])
    setFollowerCount(fc ?? 0)
    setFollowingCount(fgc ?? 0)
    setIsFollowing(!!followCheck)
  }, [username, currentUserId])

  const loadPosts = useCallback(async (profileId: string, activeTab: Tab) => {
    setLoading(true)
    let data: any[] = []

    if (activeTab === "posts") {
      const { data: d } = await supabase
        .from("posts").select("id, user_id, content, image_url, parent_id, created_at")
        .eq("user_id", profileId).is("parent_id", null)
        .order("created_at", { ascending: false }).limit(50)
      data = d ?? []
    } else if (activeTab === "replies") {
      const { data: d } = await supabase
        .from("posts").select("id, user_id, content, image_url, parent_id, created_at")
        .eq("user_id", profileId).not("parent_id", "is", null)
        .order("created_at", { ascending: false }).limit(50)
      data = d ?? []
    } else {
      const { data: liked } = await supabase
        .from("likes").select("post_id").eq("user_id", profileId)
      const ids = (liked ?? []).map((l: any) => l.post_id)
      if (ids.length === 0) { setPosts([]); setLoading(false); return }
      const { data: d } = await supabase
        .from("posts").select("id, user_id, content, image_url, parent_id, created_at")
        .in("id", ids).order("created_at", { ascending: false })
      data = d ?? []
    }

    // Enrich with profile + like meta
    const enriched = await Promise.all(data.map(async (p) => {
      const [{ data: pr }, { count: lc }, { data: ul }, { count: cc }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", p.user_id).single(),
        supabase.from("likes").select("*", { count: "exact", head: true }).eq("post_id", p.id),
        supabase.from("likes").select("user_id").eq("post_id", p.id).eq("user_id", currentUserId).maybeSingle(),
        supabase.from("posts").select("*", { count: "exact", head: true }).eq("parent_id", p.id),
      ])
      return { ...p, profiles: pr as Profile, likes_count: lc ?? 0, comments_count: cc ?? 0, liked_by_user: !!ul } as Post
    }))
    setPosts(enriched)
    setLoading(false)
  }, [currentUserId])

  useEffect(() => { loadProfile() }, [loadProfile])
  useEffect(() => { if (profile) loadPosts(profile.id, tab) }, [profile, tab, loadPosts])

  async function toggleFollow() {
    if (!profile) return
    if (isFollowing) {
      await supabase.from("follows").delete().eq("follower_id", currentUserId).eq("following_id", profile.id)
      setIsFollowing(false)
      setFollowerCount(c => c - 1)
    } else {
      await supabase.from("follows").insert({ follower_id: currentUserId, following_id: profile.id })
      setIsFollowing(true)
      setFollowerCount(c => c + 1)
    }
  }

  if (!profile) return <div className="p-8 text-center text-muted-foreground">Profile not found.</div>

  const joinDate = new Date(profile.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })

  return (
    <div>
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border px-4 py-3 flex items-center gap-6">
        <button onClick={() => router.back()} className="p-2 rounded-full hover:bg-muted transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="font-bold text-xl leading-tight">{profile.display_name ?? profile.username}</h1>
          <p className="text-sm text-muted-foreground">{posts.length} posts</p>
        </div>
      </div>

      {/* Cover photo */}
      <div className="relative h-48 bg-muted">
        {profile.cover_photo_url && (
          <Image src={profile.cover_photo_url} alt="cover" fill className="object-cover" />
        )}
      </div>

      {/* Avatar + action button */}
      <div className="px-4 flex items-end justify-between -mt-12 mb-3">
        <div className="h-24 w-24 rounded-full border-4 border-background bg-sky-500 flex items-center justify-center text-white text-3xl font-bold overflow-hidden shrink-0">
          {profile.avatar_url
            ? <Image src={profile.avatar_url} alt={profile.username} width={96} height={96} className="object-cover w-full h-full" />
            : profile.username[0].toUpperCase()}
        </div>
        {isOwn ? (
          <button
            onClick={() => setShowEdit(true)}
            className="rounded-full border border-border px-4 py-1.5 text-sm font-bold hover:bg-muted transition-colors"
          >
            Edit profile
          </button>
        ) : (
          <button
            onClick={toggleFollow}
            className={`rounded-full px-4 py-1.5 text-sm font-bold transition-colors ${
              isFollowing
                ? "border border-border hover:border-red-500 hover:text-red-500"
                : "bg-foreground text-background hover:opacity-80"
            }`}
          >
            {isFollowing ? "Following" : "Follow"}
          </button>
        )}
      </div>

      {/* Profile info */}
      <div className="px-4 pb-4 space-y-2">
        <div>
          <h2 className="font-bold text-xl">{profile.display_name ?? profile.username}</h2>
          <p className="text-muted-foreground">@{profile.username}</p>
        </div>
        {profile.bio && <p className="text-sm whitespace-pre-wrap">{profile.bio}</p>}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          {profile.location && (
            <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{profile.location}</span>
          )}
          {profile.website && (
            <a href={profile.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sky-500 hover:underline">
              <LinkIcon className="h-4 w-4" />{profile.website.replace(/^https?:\/\//, "")}
            </a>
          )}
          <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />Joined {joinDate}</span>
        </div>
        <div className="flex gap-4 text-sm">
          <button onClick={() => setFollowModal("following")} className="hover:underline">
            <span className="font-bold">{followingCount}</span>{" "}
            <span className="text-muted-foreground">Following</span>
          </button>
          <button onClick={() => setFollowModal("followers")} className="hover:underline">
            <span className="font-bold">{followerCount}</span>{" "}
            <span className="text-muted-foreground">Followers</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        {(["posts", "replies", "likes"] as Tab[]).map(t => (
          <button
            key={t} onClick={() => setTab(t)}
            className={`flex-1 py-3 text-sm font-medium capitalize transition-colors relative ${tab === t ? "text-foreground" : "text-muted-foreground hover:bg-muted"}`}
          >
            {t}
            {tab === t && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-sky-500 rounded-full" />}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {loading ? <FeedSkeleton /> : (
        posts.length === 0
          ? <p className="text-center text-muted-foreground text-sm py-12">No {tab} yet.</p>
          : posts.map(post => <PostCard key={post.id} post={post} currentUserId={currentUserId} />)
      )}

      {/* Modals */}
      {showEdit && (
        <EditProfileModal
          profile={profile}
          onClose={() => setShowEdit(false)}
          onSave={updated => { setProfile(updated); setShowEdit(false) }}
        />
      )}
      {followModal && (
        <FollowModal
          profileId={profile.id}
          tab={followModal}
          onClose={() => setFollowModal(null)}
        />
      )}
    </div>
  )
}
