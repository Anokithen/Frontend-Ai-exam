import { apiClient } from "@/lib/api-client"
import type { ApiSuccess } from "@/types/auth"
import type { StudentDashboardSummary, TeacherDashboardSummary } from "@/types/dashboard"

export const dashboardService = {
  async teacherSummary() {
    const { data } = await apiClient.get<ApiSuccess<TeacherDashboardSummary>>("/dashboard/teacher")
    return data.data
  },

  async studentSummary() {
    const { data } = await apiClient.get<ApiSuccess<StudentDashboardSummary>>("/dashboard/student")
    return data.data
  },
}
