"use client"

import { useEffect } from "react"

import { Button } from "@/components/ui/button"

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-6 text-center">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Something went wrong</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          The page could not be loaded. This is usually temporary — try again, and if it keeps happening the server
          may be unreachable.
        </p>
        {error.digest && <p className="text-xs text-muted-foreground">Reference: {error.digest}</p>}
      </div>
      <Button onClick={reset}>Try again</Button>
    </div>
  )
}
