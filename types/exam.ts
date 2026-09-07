export type QuestionType = "mcq" | "structured" | "essay"
export type ExamStatus = "draft" | "published"
export type RoomStatus = "open" | "closed"
export type SubmissionStatus = "in_progress" | "submitted" | "graded"

export interface Question {
  id: string
  order_index: number
  type: QuestionType
  prompt: string
  options: string[] | null
  correct_option_index?: number | null
  marks: number
}

export interface Exam {
  id: string
  title: string
  instructions: string | null
  status: ExamStatus
  time_limit_minutes: number
  total_marks: number
  language: string
  material_id: string | null
  question_count: number
  created_at: string
  questions?: Question[]
}

export interface ExamRoom {
  id: string
  invite_code: string
  time_limit_minutes: number
  status: RoomStatus
  participant_count: number
  created_at: string
  exam_id?: string
  exam_title?: string
  exam?: Exam
}

export interface Answer {
  question_id: string
  question_prompt: string
  question_type: QuestionType
  marks: number
  selected_option_index: number | null
  response_text: string | null
  score: number | null
  feedback: string | null
}

export interface Submission {
  id: string
  student_name: string
  started_at: string
  expires_at: string
  submitted_at: string | null
  status: SubmissionStatus
  total_score: number | null
  max_score: number
  answers?: Answer[]
}

export interface RoomParticipant {
  student_name: string
  student_email: string
  joined_at: string
  submission: Submission | null
}
