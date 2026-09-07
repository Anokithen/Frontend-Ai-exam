import Link from "next/link"

import { Button } from "@/components/ui/button"

export default function Page() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-6 text-center">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold">AI Teacher Exam Platform</h1>
        <p className="max-w-md text-muted-foreground">
          Generate exam questions from your notes with AI, run timed online exams, and get instant analytics.
        </p>
      </div>
      <div className="flex gap-3">
        <Button render={<Link href="/login" />}>Sign in</Button>
        <Button variant="outline" render={<Link href="/register" />}>
          Create account
        </Button>
      </div>
    </div>
  )
}
