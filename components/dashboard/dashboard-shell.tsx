"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  ClipboardList,
  FolderOpen,
  KeyRound,
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  Sparkles,
  Users,
} from "lucide-react"
import { toast } from "sonner"

import { LogoMark } from "@/components/dashboard/logo-mark"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useAuth } from "@/providers/auth-provider"
import { clearSession } from "@/lib/tokens"
import { authService } from "@/services/auth.service"
import type { UserRole } from "@/types/auth"

type NavItem = { href: string; label: string; icon: React.ComponentType<{ className?: string }> }

/** Only routes that actually exist get a tab — a dead nav item is worse than a missing one. */
const NAV: Record<UserRole, NavItem[]> = {
  teacher: [
    { href: "/teacher/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/teacher/materials", label: "Materials", icon: FolderOpen },
    { href: "/teacher/exams/new", label: "Generate", icon: Sparkles },
    { href: "/teacher/exams", label: "Exams", icon: ClipboardList },
  ],
  student: [
    { href: "/student/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/student/rooms/join", label: "Join room", icon: KeyRound },
  ],
  admin: [{ href: "/admin/dashboard", label: "Users", icon: Users }],
}

const WORDMARK: Record<UserRole, string> = {
  teacher: "Exam Platform",
  student: "Exam Platform",
  admin: "Exam Platform · Admin",
}

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0]?.toUpperCase() ?? "")
      .join("") || "?"
  )
}

export function DashboardShell({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const queryClient = useQueryClient()
  const { user } = useAuth()

  const logoutMutation = useMutation({
    mutationFn: authService.logout,
    onSettled: () => {
      clearSession()
      queryClient.clear()
      router.push("/login")
    },
    onError: () => {
      toast.error("Logout request failed, but you've been signed out locally.")
    },
  })

  const role = user?.role ?? "teacher"
  const nav = NAV[role]

  // The longest matching href wins, so /teacher/exams/new lights "Generate" (its own tab) while
  // /teacher/exams/<id> falls back to lighting "Exams".
  const currentHref = nav
    .filter((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href

  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground">
      <header className="sticky top-0 z-10 bg-background shadow-[0_10px_26px_rgb(15_22_30_/_0.55)]">
        <div className="mx-auto flex w-full max-w-[1240px] flex-wrap items-center gap-3 px-4 py-3.5 sm:gap-4 sm:px-6 sm:py-4">
          <Link href={`/${role}/dashboard`} className="mr-auto flex items-center gap-3 text-foreground hover:text-foreground md:mr-1">
            <LogoMark />
            <span className="font-heading text-[15px] font-semibold">{WORDMARK[role]}</span>
          </Link>

          {/* Desktop: the nav rail is sunken and each tab lifts out of it when it is the current page. */}
          <nav className="mr-auto hidden flex-wrap gap-2 rounded-2xl bg-background p-1.5 shadow-nm-inset md:flex">
            {nav.map((item) => {
              const active = item.href === currentHref
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-2 rounded-xl px-4 py-2.5 text-[13.5px] transition-all",
                    active
                      ? "bg-background text-foreground shadow-nm-xs"
                      : "text-[#93a6bd] hover:text-foreground"
                  )}
                >
                  <Icon className={cn("size-4", active && "text-nm-accent-bright")} />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div className="flex items-center gap-3">
            {user && (
              <span
                className="grid size-9 place-items-center rounded-xl bg-background text-[13px] font-medium text-nm-accent-bright shadow-nm-sm sm:size-10 sm:text-[13.5px]"
                title={user.full_name}
              >
                {initials(user.full_name)}
              </span>
            )}
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Sign out"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
            >
              {logoutMutation.isPending ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <LogOut className="size-4" />
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Room at the bottom on phones so the tab bar never covers the last card. */}
      <main className="mx-auto w-full max-w-[1240px] flex-1 px-4 pt-6 pb-28 sm:px-6 sm:pt-9 md:pb-16">
        <h1 className="sr-only">{title}</h1>
        {children}
      </main>

      {/* Phones: the same sunken rail, moved to the bottom where a thumb can reach it. */}
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-10 grid gap-1.5 bg-background px-3 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_22px_rgb(15_22_30_/_0.5)] md:hidden"
        style={{ gridTemplateColumns: `repeat(${nav.length}, minmax(0, 1fr))` }}
      >
        {nav.map((item) => {
          const active = item.href === currentHref
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex h-[58px] flex-col items-center justify-center gap-1.5 rounded-2xl text-[11px] transition-all",
                active ? "bg-background text-nm-accent-bright shadow-nm-xs" : "text-nm-dim hover:text-foreground"
              )}
            >
              <Icon className="size-5" />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
