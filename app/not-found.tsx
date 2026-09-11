import Link from "next/link"
import { Home, SearchX } from "lucide-react"

import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-6 text-center">
      <div className="grid size-16 place-items-center rounded-3xl bg-background text-nm-dim shadow-nm-inset">
        <SearchX className="size-7" />
      </div>
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Page not found</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          The page you are looking for does not exist or has been moved.
        </p>
      </div>
      <Button render={<Link href="/" />}>
        <Home />
        Go home
      </Button>
    </div>
  )
}
