import type { AuthUser } from "@/types/auth"
import type { Exam, ExamRoom, Submission } from "@/types/exam"

export interface TeacherDashboardSummary {
  teacher: AuthUser
  total_exams: number
  active_exams: number
  completed_exams: number
  total_students: number
  pending_grading: number
  recent_exams: Exam[]
}

export type StudentDashboardRoom = ExamRoom & { submission?: Submission | null }

export interface StudentDashboardSummary {
  student: AuthUser
  upcoming_exams: StudentDashboardRoom[]
  active_exams: StudentDashboardRoom[]
  completed_exams: StudentDashboardRoom[]
  average_percentage: number | null
  best_score: number | null
}
