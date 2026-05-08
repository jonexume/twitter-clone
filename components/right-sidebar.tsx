"use client"
import { useState, useEffect } from "react"
import { Search } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Profile } from "@/lib/types"

export function RightSidebar({ currentUserId }: { currentUserId?: string }) {
  const [search, setSearch] = useState("")
  const [suggestions, setSuggestions] = useState<Profile[]>([])
  const [following, setFollowing] = useState<Set<string>>(new Set())
  const supabase = createClient()

  useEffect(() => {
    if (!currentUserId) return
    async function load() {
      const [{ data: profiles }, { data: follows }] = await Promise.all([
        supabase.from("profiles").select("*").neq("id", currentUserId!).limit(5),
        supabase.from("follows").select("following_id").eq("follower_id", currentUserId!),
      ])
      if (profiles) setSuggestions(profiles)
      if (follows) setFollowing(new Set(follows.map(f => f.following_id)))
    }
    load()
  }, [currentUserId])

  async function toggleFollow(profileId: string) {
    if (!currentUserId) return
    if (following.has(profileId)) {
      await supabase.from("follows").delete().eq("follower_id", currentUserId).eq("following_id", profileId)
      setFollowing(prev => { const s = new Set(prev); s.delete(profileId); return s })
    } else {
      await supabase.from("follows").insert({ follower_id: currentUserId, following_id: profileId })
      setFollowing(prev => new Set([...prev, profileId]))
    }
  }

  const filtered = search
    ? suggestions.filter(p => p.username.toLowerCase().includes(search.toLowerCase()))
    : suggestions

  return (
    <aside className="py-4 px-4 space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search"
          className="w-full rounded-2xl bg-muted pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-sky-500/50 focus:bg-background transition-all duration-200 placeholder:text-muted-foreground"
        />
      </div>

      {/* Who to follow */}
      <div className="rounded-2xl bg-muted/60 border border-border/50 overflow-hidden">
        <div className="px-4 py-3 border-b border-border/50">
          <h2 className="font-bold text-[15px]">Who to follow</h2>
        </div>
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground px-4 py-6 text-center">No suggestions found.</p>
        )}
        {filtered.map((profile, i) => (
          <div
            key={profile.id}
            className={`flex items-center justify-between gap-3 px-4 py-3 hover:bg-muted transition-all duration-200 ${i < filtered.length - 1 ? "border-b border-border/30" : ""}`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm">
                {profile.username[0].toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm truncate leading-tight">{profile.display_name ?? profile.username}</p>
                <p className="text-xs text-muted-foreground truncate">@{profile.username}</p>
              </div>
            </div>
            <button
              onClick={() => toggleFollow(profile.id)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all duration-200 active:scale-95 ${
                following.has(profile.id)
                  ? "bg-transparent border border-border hover:border-red-400 hover:text-red-400 hover:bg-red-400/5"
                  : "bg-foreground text-background hover:opacity-80 shadow-sm"
              }`}
            >
              {following.has(profile.id) ? "Following" : "Follow"}
            </button>
          </div>
        ))}
      </div>
    </aside>
  )
}
