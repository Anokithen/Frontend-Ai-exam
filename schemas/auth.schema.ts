import { z } from "zod"

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(1, "Password is required."),
})

export type LoginValues = z.infer<typeof loginSchema>

export const registerSchema = z
  .object({
    full_name: z.string().min(2, "Name must be at least 2 characters."),
    email: z.string().email("Enter a valid email address."),
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirm_password: z.string(),
    role: z.enum(["teacher", "student"]),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords do not match.",
    path: ["confirm_password"],
  })

export type RegisterValues = z.infer<typeof registerSchema>
