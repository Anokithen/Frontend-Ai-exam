"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { isAxiosError } from "axios"
import { useState } from "react"

/**
 * Retry once, but only when retrying can help. A 4xx is the server's final answer — retrying a
 * 401 just delays the redirect to /login — while a dropped connection or a 5xx from a restarting
 * API instance often succeeds on the second try.
 */
function shouldRetry(failureCount: number, error: unknown) {
  if (failureCount >= 1) return false
  if (isAxiosError(error)) {
    const status = error.response?.status
    if (status && status >= 400 && status < 500) return false
  }
  return true
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: shouldRetry,
            refetchOnWindowFocus: false,
          },
        },
      })
  )

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
