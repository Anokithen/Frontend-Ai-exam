"use client"

import { useQuery } from "@tanstack/react-query"
import { createContext, useContext } from "react"

import { getAccessToken } from "@/lib/tokens"
import { authService } from "@/services/auth.service"
import type { AuthUser } from "@/types/auth"

interface AuthContextValue {
  user: AuthUser | undefined
  isLoading: boolean
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextValue>({
  user: undefined,
  isLoading: true,
  isAuthenticated: false,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const hasToken = typeof window !== "undefined" && Boolean(getAccessToken())

  const { data: user, isLoading } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: authService.me,
    enabled: hasToken,
    retry: false,
  })

  return (
    <AuthContext.Provider value={{ user, isLoading: hasToken && isLoading, isAuthenticated: Boolean(user) }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
