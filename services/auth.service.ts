import { apiClient } from "@/lib/api-client"
import type { ApiSuccess, AuthResponse, AuthUser } from "@/types/auth"

export interface RegisterPayload {
  full_name: string
  email: string
  password: string
  role: "teacher" | "student"
}

export interface LoginPayload {
  email: string
  password: string
}

export const authService = {
  async register(payload: RegisterPayload) {
    const { data } = await apiClient.post<ApiSuccess<AuthResponse>>("/auth/register", payload)
    return data.data
  },

  async login(payload: LoginPayload) {
    const { data } = await apiClient.post<ApiSuccess<AuthResponse>>("/auth/login", payload)
    return data.data
  },

  async logout() {
    await apiClient.post("/auth/logout")
  },

  async me() {
    const { data } = await apiClient.get<ApiSuccess<AuthUser>>("/auth/me")
    return data.data
  },
}
