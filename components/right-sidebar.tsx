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
    async function loadSuggestions() {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .neq("id", currentUserId!)
        .limit(5)
      if (data) setSuggestions(data)
    }
    async function loadFollowing() {
      const { data } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", currentUserId!)
      if (data) setFollowing(new Set(data.map(f => f.following_id)))
    }
    loadSuggestions()
    loadFollowing()
  }, [currentUserId])

  async function toggleFollow(profileId: string) {
    if (!currentUserId) return
    if (following.has(profileId)) {
      await supabase.from("follows").delete()
        .eq("follower_id", currentUserId).eq("following_id", profileId)
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
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search"
          className="w-full rounded-full bg-muted pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-sky-500 focus:bg-background transition-colors"
        />
      </div>

      {/* Who to follow */}
      <div className="rounded-2xl bg-muted p-4 space-y-4">
        <h2 className="font-bold text-lg">Who to follow</h2>
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground">No suggestions found.</p>
        )}
        {filtered.map(profile => (
          <div key={profile.id} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-10 w-10 rounded-full bg-sky-500 flex items-center justify-center text-white font-bold shrink-0">
                {profile.username[0].toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">@{profile.username}</p>
                {profile.bio && <p className="text-xs text-muted-foreground truncate">{profile.bio}</p>}
              </div>
            </div>
            <button
              onClick={() => toggleFollow(profile.id)}
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-bold transition-colors ${
                following.has(profile.id)
                  ? "bg-transparent border border-border hover:border-red-500 hover:text-red-500"
                  : "bg-foreground text-background hover:opacity-80"
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
