import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios"

import { API_URL } from "@/lib/env"
import { clearSession, getAccessToken, getRefreshToken, setAccessToken } from "@/lib/tokens"
import type { ApiError } from "@/types/auth"

/**
 * The API is a separate deployment, so a request can hang on a cold start or a restart with no
 * TCP error to end it. Without a ceiling the UI spins forever; the few endpoints that legitimately
 * run for minutes (AI generation, text extraction, PDF rendering) opt out with `timeout: 0`.
 */
const REQUEST_TIMEOUT_MS = 30_000

export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: REQUEST_TIMEOUT_MS,
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
    const message = error.response?.data?.error?.message
    if (message) return message

    // No response at all: the server never answered, which reads very differently to a user than
    // a validation error and is the common failure once the API is on its own host.
    if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
      return "The server took too long to respond. Please try again."
    }
    if (!error.response) {
      return "Could not reach the server. Check your connection and try again."
    }
    return fallback
  }
  return fallback
}
