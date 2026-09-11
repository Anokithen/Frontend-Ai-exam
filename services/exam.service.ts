import { apiClient, refreshSession } from "@/lib/api-client"
import { getAccessToken } from "@/lib/tokens"
import type { ApiSuccess } from "@/types/auth"
import type { Exam, ExamRoom, Question, Submission } from "@/types/exam"

export interface QuestionCounts {
  mcq?: number
  structured?: number
  essay?: number
}

export interface QuestionInput {
  id?: string
  type: Question["type"]
  prompt: string
  options?: string[] | null
  correct_option_index?: number | null
  marks: number
}

export type StageStatus = "pending" | "running" | "done" | "failed"

/** A question as the model wrote it, before it has been saved and given an id. */
export type GeneratedQuestion = Pick<Question, "type" | "prompt" | "marks"> & {
  options?: string[]
  correct_option_index?: number
}

/** How far through the requested questions the writing stage is. */
export interface QuestionProgress {
  /** Questions the model has finished writing. */
  created: number
  /** Number of the question being written right now; null between questions. */
  writing: number | null
  /** Type of the question being written right now. */
  writing_type?: Question["type"]
  /** How many questions were asked for. */
  total: number
}

export interface GenerationStage {
  id: string
  label: string
  status: StageStatus
  detail?: string
  progress?: QuestionProgress
  /** The questions written so far, in the order they landed. */
  questions?: GeneratedQuestion[]
}

export interface GeneratePayload {
  material_title: string
  title: string
  time_limit_minutes: number
  question_counts: QuestionCounts
  language: string
  /** Text the teacher has corrected, keyed by material id, so it isn't read again. */
  texts?: Record<string, string>
}

export type StreamEvent =
  | { type: "stages"; stages: GenerationStage[] }
  | { type: "stage"; id: string; status: StageStatus; detail?: string }
  | ({ type: "progress"; id: string; question?: GeneratedQuestion } & QuestionProgress)
  | { type: "done"; exam: Exam }
  | { type: "error"; code: string; message: string }

async function postStream(payload: GeneratePayload, retryOn401 = true): Promise<Response> {
  const response = await fetch(`${apiClient.defaults.baseURL}/exams/generate/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getAccessToken() ?? ""}`,
    },
    body: JSON.stringify(payload),
  })

  if (response.status === 401 && retryOn401 && (await refreshSession())) {
    return postStream(payload, false)
  }
  return response
}

export const examService = {
  async generate(payload: GeneratePayload) {
    // Model calls run for minutes, so this one waits as long as the server needs.
    const { data } = await apiClient.post<ApiSuccess<Exam>>("/exams/generate", payload, { timeout: 0 })
    return data.data
  },

  /**
   * Generate an exam, reporting each stage as the server finishes it.
   *
   * The work takes long enough that a teacher needs to see it moving, so the server streams
   * a line per stage and `onEvent` is called with each one.
   */
  async generateStreamed(payload: GeneratePayload, onEvent: (event: StreamEvent) => void): Promise<Exam> {
    const response = await postStream(payload)

    if (!response.ok) {
      const body = await response.json().catch(() => null)
      throw new Error(body?.error?.message ?? "Failed to generate exam.")
    }

    let exam: Exam | null = null
    let failure: string | null = null

    const handle = (frame: string) => {
      const data = frame
        .split("\n")
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.slice(5).trim())
        .join("")
      if (!data) return
      let event: StreamEvent
      try {
        event = JSON.parse(data) as StreamEvent
      } catch {
        return
      }
      onEvent(event)
      if (event.type === "done") exam = event.exam
      if (event.type === "error") failure = event.message
    }

    if (response.body) {
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ""
      // Frames are separated by a blank line, and one can arrive split across reads.
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const frames = buffer.split("\n\n")
        buffer = frames.pop() ?? ""
        frames.forEach(handle)
      }
      if (buffer.trim()) handle(buffer)
    } else {
      // No streaming body (older browser): the stages all arrive together at the end.
      ;(await response.text()).split("\n\n").forEach(handle)
    }

    if (failure) throw new Error(failure)
    if (!exam) throw new Error("The server did not return an exam.")
    return exam
  },

  async list() {
    const { data } = await apiClient.get<ApiSuccess<{ exams: Exam[] }>>("/exams")
    return data.data.exams
  },

  async get(examId: string) {
    const { data } = await apiClient.get<ApiSuccess<Exam>>(`/exams/${examId}`)
    return data.data
  },

  async update(
    examId: string,
    payload: Partial<{ title: string; instructions: string; time_limit_minutes: number; questions: QuestionInput[] }>
  ) {
    const { data } = await apiClient.patch<ApiSuccess<Exam>>(`/exams/${examId}`, payload)
    return data.data
  },

  async publish(examId: string) {
    const { data } = await apiClient.post<ApiSuccess<Exam>>(`/exams/${examId}/publish`)
    return data.data
  },

  async remove(examId: string) {
    await apiClient.delete(`/exams/${examId}`)
  },

  async downloadPdf(examId: string, title: string, withAnswers: boolean) {
    const response = await apiClient.get(`/exams/${examId}/pdf`, {
      params: withAnswers ? { with_answers: "1" } : undefined,
      responseType: "blob",
      timeout: 0,
    })
    const url = URL.createObjectURL(response.data as Blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${title.replace(/\s+/g, "_")}${withAnswers ? "_with_answers" : ""}.pdf`
    link.click()
    URL.revokeObjectURL(url)
  },

  async createRoom(examId: string, timeLimitMinutes?: number) {
    const { data } = await apiClient.post<ApiSuccess<ExamRoom>>(`/exams/${examId}/rooms`, {
      time_limit_minutes: timeLimitMinutes,
    })
    return data.data
  },

  async listRooms(examId: string) {
    const { data } = await apiClient.get<ApiSuccess<{ rooms: ExamRoom[] }>>(`/exams/${examId}/rooms`)
    return data.data.rooms
  },

  async getRoom(roomId: string) {
    const { data } = await apiClient.get<ApiSuccess<ExamRoom & { participants: unknown[] }>>(`/rooms/${roomId}`)
    return data.data
  },

  async closeRoom(roomId: string) {
    const { data } = await apiClient.post<ApiSuccess<ExamRoom>>(`/rooms/${roomId}/close`)
    return data.data
  },

  async listSubmissions(roomId: string) {
    const { data } = await apiClient.get<ApiSuccess<{ submissions: Submission[] }>>(`/rooms/${roomId}/submissions`)
    return data.data.submissions
  },

  async getSubmission(submissionId: string) {
    const { data } = await apiClient.get<ApiSuccess<Submission>>(`/rooms/submissions/${submissionId}`)
    return data.data
  },

  async gradeAnswer(submissionId: string, questionId: string, payload: { score: number; feedback?: string }) {
    const { data } = await apiClient.patch<ApiSuccess<Submission>>(
      `/rooms/submissions/${submissionId}/answers/${questionId}`,
      payload
    )
    return data.data
  },
}
