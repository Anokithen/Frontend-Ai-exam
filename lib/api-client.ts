import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios"

import { clearSession, getAccessToken, getRefreshToken, setAccessToken } from "@/lib/tokens"
import type { ApiError } from "@/types/auth"

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api",
})

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let refreshPromise: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) return null

  try {
    const { data } = await axios.post<{ data: { access_token: string } }>(
      `${apiClient.defaults.baseURL}/auth/refresh`,
      {},
      { headers: { Authorization: `Bearer ${refreshToken}` } }
    )
    setAccessToken(data.data.access_token)
    return data.data.access_token
  } catch {
    clearSession()
    return null
  }
}

/** Refresh the access token, sharing one in-flight refresh between callers. */
export function refreshSession(): Promise<string | null> {
  refreshPromise ??= refreshAccessToken().finally(() => {
    refreshPromise = null
  })
  return refreshPromise
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true

      const newToken = await refreshSession()
      if (newToken) {
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return apiClient(originalRequest)
      }

      clearSession()
      if (typeof window !== "undefined") {
        window.location.href = "/login"
      }
    }

    return Promise.reject(error)
  }
)

export function getApiErrorMessage(error: unknown, fallback = "Something went wrong. Please try again."): string {
  if (axios.isAxiosError<ApiError>(error)) {
    return error.response?.data?.error?.message ?? fallback
  }
  return fallback
}
