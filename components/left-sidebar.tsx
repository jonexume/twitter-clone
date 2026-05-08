"use client"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { Bird, Home, Bell, User, Sun, Moon, LogOut, PenSquare } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

interface LeftSidebarProps {
  username?: string
  onPostClick?: () => void
}

export function LeftSidebar({ username, onPostClick }: LeftSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { resolvedTheme, setTheme } = useTheme()
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
    <aside className="flex flex-col h-screen sticky top-0 py-3 px-2 xl:px-4">
      {/* Logo */}
      <Link
        href="/"
        className="p-3 rounded-2xl hover:bg-muted transition-all duration-200 w-fit mb-1 group"
      >
        <Bird className="h-7 w-7 text-sky-500 group-hover:scale-110 transition-transform duration-200" />
      </Link>

      {/* Nav */}
      <nav className="flex flex-col gap-0.5 flex-1">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href
          return (
            <Link
              key={href} href={href}
              className={cn(
                "flex items-center gap-3.5 px-3 py-2.5 rounded-2xl text-[15px] font-medium transition-all duration-200 w-fit xl:w-full group",
                active
                  ? "font-semibold text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <Icon className={cn(
                "h-[22px] w-[22px] shrink-0 transition-transform duration-200 group-hover:scale-110",
                active && "text-sky-500"
              )} />
              <span className="hidden xl:block">{label}</span>
              {active && <span className="hidden xl:block ml-auto h-1.5 w-1.5 rounded-full bg-sky-500" />}
            </Link>
          )
        })}

        {/* Post button */}
        <button
          onClick={onPostClick}
          className="mt-3 bg-sky-500 hover:bg-sky-400 active:scale-95 text-white font-semibold rounded-2xl transition-all duration-200 xl:w-full xl:py-3 xl:px-4 p-3 w-fit flex items-center justify-center gap-2 shadow-lg shadow-sky-500/25 hover:shadow-sky-500/40"
        >
          <PenSquare className="h-[18px] w-[18px] xl:hidden" />
          <span className="hidden xl:block text-[15px]">Post</span>
        </button>
      </nav>

      {/* Bottom */}
      <div className="flex flex-col gap-0.5 pb-2">
        <button
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          className="flex items-center gap-3.5 px-3 py-2.5 rounded-2xl hover:bg-muted transition-all duration-200 w-fit xl:w-full text-left text-muted-foreground hover:text-foreground group"
        >
          {resolvedTheme === "dark"
            ? <Sun className="h-[18px] w-[18px] shrink-0 group-hover:rotate-12 transition-transform duration-300" />
            : <Moon className="h-[18px] w-[18px] shrink-0 group-hover:-rotate-12 transition-transform duration-300" />}
          <span className="hidden xl:block text-sm">{resolvedTheme === "dark" ? "Light mode" : "Dark mode"}</span>
        </button>

        {username && (
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-2xl hover:bg-muted transition-all duration-200 cursor-default">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-sm">
              {username[0].toUpperCase()}
            </div>
            <div className="hidden xl:flex flex-1 items-center justify-between min-w-0">
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate leading-tight">@{username}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-lg hover:bg-red-500/10 hover:text-red-500 text-muted-foreground transition-all duration-200 ml-2"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
