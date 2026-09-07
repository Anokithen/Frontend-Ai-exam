export type UserRole = "teacher" | "student" | "admin"

export interface TeacherProfile {
  institution: string | null
  subject_specialization: string | null
  bio: string | null
}

export interface StudentProfile {
  institution: string | null
  grade_level: string | null
  bio: string | null
}

export interface AuthUser {
  id: string
  full_name: string
  email: string
  role: UserRole
  is_active: boolean
  created_at: string
  profile?: TeacherProfile | StudentProfile
}

export interface AuthTokens {
  access_token: string
  refresh_token: string
}

export interface AuthResponse extends AuthTokens {
  user: AuthUser
}

export interface ApiSuccess<T> {
  success: true
  data: T
  message: string
}

export interface ApiError {
  success: false
  error: {
    code: string
    message: string
    details?: unknown
  }
}
