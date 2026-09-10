import type { Metadata } from "next"

import { RegisterForm } from "@/components/auth/register-form"

export const metadata: Metadata = {
  title: "Create account",
  description: "Create a teacher or student account on the AI Teacher Exam Platform.",
}

export default function RegisterPage() {
  return <RegisterForm />
}
