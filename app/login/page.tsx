import type { Metadata } from "next"
import { Suspense } from "react"

import { LoginForm } from "@/components/auth/login-form"

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to the AI Teacher Exam Platform.",
}

export default function LoginPage() {
  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  )
}
