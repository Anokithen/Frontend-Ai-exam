import { apiClient } from "@/lib/api-client"
import type { ApiSuccess } from "@/types/auth"
import type { Exam, ExamRoom, Submission } from "@/types/exam"

export const roomService = {
  async join(inviteCode: string) {
    const { data } = await apiClient.post<ApiSuccess<ExamRoom>>("/rooms/join", { invite_code: inviteCode })
    return data.data
  },

  async mine() {
    const { data } = await apiClient.get<ApiSuccess<{ rooms: (ExamRoom & { submission: Submission | null })[] }>>(
      "/rooms/mine"
    )
    return data.data.rooms
  },

  async start(roomId: string) {
    const { data } = await apiClient.post<ApiSuccess<Submission>>(`/rooms/${roomId}/start`)
    return data.data
  },

  async getExam(roomId: string) {
    const { data } = await apiClient.get<ApiSuccess<Exam & { submission: Submission }>>(`/rooms/${roomId}/exam`)
    return data.data
  },

  async saveAnswer(
    roomId: string,
    payload: { question_id: string; selected_option_index?: number; response_text?: string }
  ) {
    await apiClient.patch(`/rooms/${roomId}/answers`, payload)
  },

  async submit(roomId: string) {
    const { data } = await apiClient.post<ApiSuccess<Submission>>(`/rooms/${roomId}/submit`)
    return data.data
  },
}
