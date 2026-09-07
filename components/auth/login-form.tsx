"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>Enter your credentials to access your account.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit((values) => mutation.mutate(values))}>
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" {...register("email")} />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" autoComplete="current-password" {...register("password")} />
            {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
          </div>
          <Button type="submit" disabled={mutation.isPending} className="mt-2">
            {mutation.isPending ? "Signing in..." : "Sign in"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            No account?{" "}
            <Link href="/register" className="font-medium text-foreground underline underline-offset-4">
              Register
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
