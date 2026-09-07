import { apiClient } from "@/lib/api-client"
import type { AdminStats, ListUsersParams, PaginatedUsers, UpdateUserPayload } from "@/types/admin"
import type { ApiSuccess, AuthUser } from "@/types/auth"

export const adminService = {
  async stats() {
    const { data } = await apiClient.get<ApiSuccess<AdminStats>>("/admin/stats")
    return data.data
  },

  async listUsers(params: ListUsersParams = {}) {
    const { data } = await apiClient.get<ApiSuccess<PaginatedUsers>>("/admin/users", { params })
    return data.data
  },

  async updateUser(publicId: string, payload: UpdateUserPayload) {
    const { data } = await apiClient.patch<ApiSuccess<AuthUser>>(`/admin/users/${publicId}`, payload)
    return data.data
  },

  async deleteUser(publicId: string) {
    await apiClient.delete(`/admin/users/${publicId}`)
  },
}
