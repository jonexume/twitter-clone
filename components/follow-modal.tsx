"use client"
import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Profile } from "@/lib/types"

interface FollowModalProps {
  profileId: string
  tab: "followers" | "following"
  onClose: () => void
}

export function FollowModal({ profileId, tab, onClose }: FollowModalProps) {
  const [users, setUsers] = useState<Profile[]>([])
  const [activeTab, setActiveTab] = useState(tab)
  const [mounted, setMounted] = useState(false)
  const supabase = createClient()

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    async function load() {
      if (activeTab === "followers") {
        const { data } = await supabase
          .from("follows")
          .select("profiles!follows_follower_id_fkey(*)")
          .eq("following_id", profileId)
        setUsers((data ?? []).map((r: any) => r.profiles).filter(Boolean))
      } else {
        const { data } = await supabase
          .from("follows")
          .select("profiles!follows_following_id_fkey(*)")
          .eq("follower_id", profileId)
        setUsers((data ?? []).map((r: any) => r.profiles).filter(Boolean))
      }
    }
    load()
  }, [activeTab, profileId])

  const modal = (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center bg-black/60 pt-16 px-4">
      <div className="w-full max-w-lg bg-background rounded-2xl shadow-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center gap-4 px-4 py-3 border-b border-border">
          <button onClick={onClose} className="p-2 rounded-full hover:bg-muted transition-colors">
            <X className="h-5 w-5" />
          </button>
          <h2 className="font-bold text-lg">Connections</h2>
        </div>

        <div className="flex border-b border-border">
          {(["followers", "following"] as const).map(t => (
            <button
              key={t} onClick={() => setActiveTab(t)}
              className={`flex-1 py-3 text-sm font-medium capitalize transition-colors relative ${activeTab === t ? "text-foreground" : "text-muted-foreground hover:bg-muted"}`}
            >
              {t}
              {activeTab === t && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-sky-500 rounded-full" />}
            </button>
          ))}
        </div>

        <div className="overflow-y-auto flex-1">
          {users.length === 0 && (
            <p className="text-center text-muted-foreground text-sm py-12">
              {activeTab === "followers" ? "No followers yet." : "Not following anyone yet."}
            </p>
          )}
          {users.map(user => (
            <div key={user.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors">
              <div className="h-10 w-10 rounded-full bg-sky-500 flex items-center justify-center text-white font-bold shrink-0 overflow-hidden">
                {user.avatar_url
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={user.avatar_url} alt={user.username} className="w-full h-full object-cover" />
                  : user.username[0].toUpperCase()}
              </div>
              <div>
                <p className="font-bold text-sm">{user.display_name ?? user.username}</p>
                <p className="text-muted-foreground text-sm">@{user.username}</p>
                {user.bio && <p className="text-sm mt-0.5 line-clamp-1">{user.bio}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  if (!mounted) return null
  return createPortal(modal, document.body)
}
