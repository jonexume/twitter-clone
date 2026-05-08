import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { LeftSidebar } from "@/components/left-sidebar"
import { RightSidebar } from "@/components/right-sidebar"
import { ProfileView } from "@/components/profile-view"

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: profile } = await supabase.from("profiles").select("username").eq("id", user.id).single()
  const currentUsername = (profile as { username: string } | null)?.username ?? user.email?.split("@")[0] ?? "user"

  return (
    <div className="min-h-screen max-w-7xl mx-auto flex">
      <div className="w-16 xl:w-72 shrink-0">
        <LeftSidebar username={currentUsername} />
      </div>
      <main className="flex-1 min-w-0 border-x border-border">
        <ProfileView username={username} currentUserId={user.id} />
      </main>
      <div className="hidden lg:block w-80 xl:w-96 shrink-0">
        <RightSidebar currentUserId={user.id} />
      </div>
    </div>
  )
}
