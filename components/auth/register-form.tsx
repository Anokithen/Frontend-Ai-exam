"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { AuthLayout } from "@/components/auth/auth-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PasswordInput } from "@/components/ui/password-input"
import { cn } from "@/lib/utils"
import { getApiErrorMessage } from "@/lib/api-client"
import { setSession } from "@/lib/tokens"
import { type RegisterValues, registerSchema } from "@/schemas/auth.schema"
import { authService } from "@/services/auth.service"

const ROLES = [
  { key: "teacher", label: "Teacher" },
  { key: "student", label: "Student" },
] as const

/** Four independent things worth doing to a password, one bar each. */
function strengthScore(password: string) {
  if (!password) return 0
  let score = 0
  if (password.length >= 8) score++
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++
  if (/\d/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++
  return score
}

const STRENGTH_COLOR = ["", "#ff8f8f", "#f2b45c", "#7bc6ff", "#4dd8a0"]
const STRENGTH_LABEL = ["Password strength", "Weak", "Fair", "Good", "Strong"]

export function RegisterForm() {
  const router = useRouter()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: "teacher" },
  })

  const role = watch("role")
  const password = watch("password") ?? ""
  const confirmPassword = watch("confirm_password") ?? ""
  const score = strengthScore(password)
  // Shown while typing, ahead of the schema's own check on submit.
  const mismatch = confirmPassword && password !== confirmPassword ? "Passwords do not match." : ""

  const mutation = useMutation({
    mutationFn: authService.register,
    onSuccess: (data) => {
      setSession(data.access_token, data.refresh_token, data.user.role)
      toast.success("Account created.")
      router.push(data.user.role === "teacher" ? "/teacher/dashboard" : "/student/dashboard")
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Registration failed."))
    },
  })

  return (
    <AuthLayout>
      <h2 className="font-heading text-[25px] font-semibold tracking-tight">Create account</h2>
      <p className="mt-2 text-[14.5px] text-muted-foreground">
        Takes a minute. You can upload notes right after.
      </p>

      <form className="mt-6 flex flex-col" onSubmit={handleSubmit((values) => mutation.mutate(values))}>
        <div className="mb-3 text-[13px] text-[#93a6bd]">I am a</div>
        {/* The chosen role presses in; the other stays raised. */}
        <div className="grid grid-cols-2 gap-3">
          {ROLES.map((option) => {
            const selected = role === option.key
            return (
              <button
                key={option.key}
                type="button"
                aria-pressed={selected}
                onClick={() => setValue("role", option.key)}
                className={cn(
                  "flex items-center gap-3 rounded-2xl bg-background px-4 py-4 text-[14.5px] transition-all",
                  selected ? "text-foreground shadow-nm-inset" : "text-[#93a6bd] shadow-nm-sm"
                )}
              >
                <span
                  className={cn(
                    "size-2.5 rounded-full",
                    selected ? "bg-primary shadow-[0_0_12px_rgb(77_141_255_/_0.7)]" : "bg-[#33465a]"
                  )}
                />
                {option.label}
              </button>
            )
          })}
        </div>

        <Label htmlFor="full_name" className="mt-6 mb-2.5 text-[13px] font-normal text-[#93a6bd]">
          Full name
        </Label>
        <Input
          id="full_name"
          autoComplete="name"
          placeholder="A. Perera"
          aria-invalid={Boolean(errors.full_name)}
          {...register("full_name")}
        />
        {errors.full_name && <p className="mt-2 text-[12.5px] text-destructive">{errors.full_name.message}</p>}

        <Label htmlFor="email" className="mt-5 mb-2.5 text-[13px] font-normal text-[#93a6bd]">
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
          autoComplete="new-password"
          placeholder="At least 8 characters"
          aria-invalid={Boolean(errors.password)}
          {...register("password")}
        />
        <div className="mt-3 flex gap-2" aria-hidden="true">
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              className={cn("h-1.5 flex-1 rounded-full", index < score ? "" : "bg-background shadow-nm-inset-sm")}
              style={
                index < score
                  ? { background: STRENGTH_COLOR[score], boxShadow: `0 0 10px ${STRENGTH_COLOR[score]}66` }
                  : undefined
              }
            />
          ))}
        </div>
        <div className="mt-2.5 text-[12.5px] text-muted-foreground">{STRENGTH_LABEL[score]}</div>
        {errors.password && <p className="mt-2 text-[12.5px] text-destructive">{errors.password.message}</p>}

        <Label htmlFor="confirm_password" className="mt-5 mb-2.5 text-[13px] font-normal text-[#93a6bd]">
          Confirm password
        </Label>
        <PasswordInput
          id="confirm_password"
          autoComplete="new-password"
          placeholder="Repeat it"
          aria-invalid={Boolean(errors.confirm_password) || Boolean(mismatch)}
          {...register("confirm_password")}
        />
        {(mismatch || errors.confirm_password) && (
          <p className="mt-2 text-[12.5px] text-destructive">{errors.confirm_password?.message ?? mismatch}</p>
        )}

        <Button type="submit" size="lg" disabled={mutation.isPending} className="mt-7 w-full">
          {mutation.isPending ? "Creating account..." : "Create account"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already registered?{" "}
        <Link href="/login" className="font-medium">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  )
}
