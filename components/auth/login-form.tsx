"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { LoaderCircle, LogIn } from "lucide-react"
import { toast } from "sonner"

import { AuthLayout } from "@/components/auth/auth-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PasswordInput } from "@/components/ui/password-input"
import { getApiErrorMessage } from "@/lib/api-client"
import { setSession } from "@/lib/tokens"
import { type LoginValues, loginSchema } from "@/schemas/auth.schema"
import { authService } from "@/services/auth.service"

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) })

  const mutation = useMutation({
    mutationFn: authService.login,
    onSuccess: (data) => {
      setSession(data.access_token, data.refresh_token, data.user.role)
      toast.success(`Welcome back, ${data.user.full_name}.`)
      const redirect = searchParams.get("redirect")
      const roleHome =
        data.user.role === "admin"
          ? "/admin/dashboard"
          : data.user.role === "teacher"
            ? "/teacher/dashboard"
            : "/student/dashboard"
      router.push(redirect ?? roleHome)
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Login failed. Check your credentials."))
    },
  })

  return (
    <AuthLayout showBackHome>
      <h2 className="font-heading text-[25px] font-semibold tracking-tight">Sign in</h2>
      <p className="mt-2 text-[14.5px] text-muted-foreground">Use the account your school set up for you.</p>

      <form className="mt-7 flex flex-col" onSubmit={handleSubmit((values) => mutation.mutate(values))}>
        <Label htmlFor="email" className="mb-2.5 text-[13px] font-normal text-[#93a6bd]">
          Email
        </Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@school.edu"
          aria-invalid={Boolean(errors.email)}
          {...register("email")}
        />
        {errors.email && <p className="mt-2 text-[12.5px] text-destructive">{errors.email.message}</p>}

        <Label htmlFor="password" className="mt-5 mb-2.5 text-[13px] font-normal text-[#93a6bd]">
          Password
        </Label>
        <PasswordInput
          id="password"
          autoComplete="current-password"
          placeholder="••••••••"
          aria-invalid={Boolean(errors.password)}
          {...register("password")}
        />
        {errors.password && <p className="mt-2 text-[12.5px] text-destructive">{errors.password.message}</p>}

        <Button type="submit" size="lg" disabled={mutation.isPending} className="mt-7 w-full">
          {mutation.isPending ? <LoaderCircle className="animate-spin" /> : <LogIn />}
          {mutation.isPending ? "Signing in..." : "Sign in"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        No account?{" "}
        <Link href="/register" className="font-medium">
          Create one
        </Link>
      </p>
    </AuthLayout>
  )
}
