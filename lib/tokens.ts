import Cookies from "js-cookie"

const ACCESS_TOKEN_KEY = "access_token"
const REFRESH_TOKEN_KEY = "refresh_token"
const ROLE_KEY = "user_role"

const cookieOptions = {
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  expires: 30,
}

export function getAccessToken() {
  return Cookies.get(ACCESS_TOKEN_KEY) ?? null
}

export function getRefreshToken() {
  return Cookies.get(REFRESH_TOKEN_KEY) ?? null
}

export function getUserRole() {
  return Cookies.get(ROLE_KEY) ?? null
}

export function setSession(accessToken: string, refreshToken: string, role: string) {
  Cookies.set(ACCESS_TOKEN_KEY, accessToken, cookieOptions)
  Cookies.set(REFRESH_TOKEN_KEY, refreshToken, cookieOptions)
  Cookies.set(ROLE_KEY, role, cookieOptions)
}

export function setAccessToken(accessToken: string) {
  Cookies.set(ACCESS_TOKEN_KEY, accessToken, cookieOptions)
}

export function clearSession() {
  Cookies.remove(ACCESS_TOKEN_KEY)
  Cookies.remove(REFRESH_TOKEN_KEY)
  Cookies.remove(ROLE_KEY)
}
