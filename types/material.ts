export type MaterialType = "pdf" | "image"

export interface Material {
  id: string
  title: string
  file_type: MaterialType
  original_filename: string
  mime_type: string
  file_size: number
  has_text: boolean
  text_length: number
  created_at: string
}
