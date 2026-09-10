"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { LogOut } from "lucide-react"
import { toast } from "sonner"

import { LogoMark } from "@/components/dashboard/logo-mark"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useAuth } from "@/providers/auth-provider"
import { clearSession } from "@/lib/tokens"
import { authService } from "@/services/auth.service"
import type { UserRole } from "@/types/auth"

/** Only routes that actually exist get a tab — a dead nav item is worse than a missing one. */
const NAV: Record<UserRole, { href: string; label: string }[]> = {
  teacher: [
    { href: "/teacher/dashboard", label: "Dashboard" },
    { href: "/teacher/materials", label: "Materials" },
    { href: "/teacher/exams/new", label: "Generate" },
    { href: "/teacher/exams", label: "Exams" },
  ],
  student: [
    { href: "/student/dashboard", label: "Dashboard" },
    { href: "/student/rooms/join", label: "Join room" },
  ],
  admin: [{ href: "/admin/dashboard", label: "Users" }],
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
        <div className="mx-auto flex w-full max-w-[1240px] flex-wrap items-center gap-4 px-6 py-4">
          <Link href={`/${role}/dashboard`} className="mr-1 flex items-center gap-3 text-foreground hover:text-foreground">
            <LogoMark />
            <span className="font-heading text-[15px] font-semibold">{WORDMARK[role]}</span>
          </Link>

          {/* The nav rail is sunken and each tab lifts out of it when it is the current page. */}
          <nav className="mr-auto flex flex-wrap gap-2 rounded-2xl bg-background p-1.5 shadow-nm-inset">
            {nav.map((item) => {
              const active = item.href === currentHref
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "rounded-xl px-4 py-2.5 text-[13.5px] transition-all",
                    active
                      ? "bg-background text-foreground shadow-nm-xs"
                      : "text-[#93a6bd] hover:text-foreground"
                  )}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div className="flex items-center gap-3">
            {user && (
              <span
                className="grid size-10 place-items-center rounded-xl bg-background text-[13.5px] font-medium text-nm-accent-bright shadow-nm-sm"
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
              <LogOut className="size-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1240px] flex-1 px-6 pt-9 pb-16">
        <h1 className="sr-only">{title}</h1>
        {children}
      </main>
    </div>
  )
}
