import type { AuthUser, UserRole } from "@/types/auth"

export interface AdminStats {
  total_users: number
  total_teachers: number
  total_students: number
  total_admins: number
  active_users: number
  inactive_users: number
}

export interface PaginatedUsers {
  users: AuthUser[]
  page: number
  per_page: number
  total: number
  total_pages: number
}

export interface ListUsersParams {
  role?: UserRole
  is_active?: boolean
  search?: string
  page?: number
  per_page?: number
}

export interface UpdateUserPayload {
  role?: UserRole
  is_active?: boolean
}
