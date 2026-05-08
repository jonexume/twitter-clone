"use client"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { Bird, Home, Bell, User, Sun, Moon, LogOut, PenSquare } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

interface LeftSidebarProps {
  username?: string
}

export function LeftSidebar({ username, onPostClick }: LeftSidebarProps & { onPostClick?: () => void }) {
  const pathname = usePathname()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const supabase = createClient()

  const navItems = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/notifications", icon: Bell, label: "Notifications" },
    { href: username ? `/${username}` : "/profile", icon: User, label: "Profile" },
  ]

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  return (
    <aside className="flex flex-col h-screen sticky top-0 py-4 px-3 xl:px-6">
      {/* Logo */}
      <Link href="/" className="p-3 rounded-full hover:bg-muted transition-colors w-fit mb-2">
        <Bird className="h-7 w-7 text-sky-500" />
      </Link>

      {/* Nav */}
      <nav className="flex flex-col gap-1 flex-1">
        {navItems.map(({ href, icon: Icon, label }) => (
          <Link
            key={href} href={href}
            className={cn(
              "flex items-center gap-4 px-3 py-3 rounded-full text-xl font-medium hover:bg-muted transition-colors w-fit xl:w-full",
              pathname === href && "font-bold"
            )}
          >
            <Icon className="h-6 w-6 shrink-0" />
            <span className="hidden xl:block">{label}</span>
          </Link>
        ))}

        {/* Post button */}
        <button
          onClick={onPostClick}
          className="mt-4 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-full transition-colors xl:w-full xl:py-3 xl:px-4 p-3 w-fit flex items-center justify-center gap-2"
        >
          <PenSquare className="h-5 w-5 xl:hidden" />
          <span className="hidden xl:block">Post</span>
        </button>
      </nav>

      {/* Bottom actions */}
      <div className="flex flex-col gap-1">
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="flex items-center gap-4 px-3 py-3 rounded-full hover:bg-muted transition-colors w-fit xl:w-full text-left"
        >
          {theme === "dark"
            ? <Sun className="h-5 w-5 shrink-0" />
            : <Moon className="h-5 w-5 shrink-0" />}
          <span className="hidden xl:block text-sm">{theme === "dark" ? "Light mode" : "Dark mode"}</span>
        </button>

        {username && (
          <div className="flex items-center gap-3 px-3 py-3 rounded-full hover:bg-muted transition-colors">
            <div className="h-8 w-8 rounded-full bg-sky-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
              {username[0].toUpperCase()}
            </div>
            <div className="hidden xl:flex flex-1 items-center justify-between min-w-0">
              <span className="text-sm font-medium truncate">@{username}</span>
              <button onClick={handleLogout} className="p-1 hover:text-red-500 transition-colors">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
