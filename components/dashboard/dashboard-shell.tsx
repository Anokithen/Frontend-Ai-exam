"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { LogOut } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/providers/auth-provider"
import { clearSession } from "@/lib/tokens"
import { authService } from "@/services/auth.service"

export function DashboardShell({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  const router = useRouter()
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

  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex items-center justify-between border-b px-6 py-4">
        <div>
          <h1 className="text-lg font-semibold">{title}</h1>
          {user && <p className="text-sm text-muted-foreground">{user.full_name}</p>}
        </div>
        <Button variant="outline" size="sm" onClick={() => logoutMutation.mutate()} disabled={logoutMutation.isPending}>
          <LogOut className="size-4" />
          Sign out
        </Button>
      </header>
      <Separator />
      <main className="flex-1 p-6">{children}</main>
    </div>
  )
}
