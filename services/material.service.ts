import axios from "axios"

import { apiClient } from "@/lib/api-client"
import type { ApiSuccess } from "@/types/auth"
import type { Material } from "@/types/material"

interface UploadSignature {
  timestamp: number
  folder: string
  public_id: string
  signature: string
  api_key: string
  cloud_name: string
}

const RAW_EXTENSIONS = new Set(["pdf"])

function resourceTypeFor(filename: string): "raw" | "image" {
  const ext = filename.split(".").pop()?.toLowerCase() ?? ""
  return RAW_EXTENSIONS.has(ext) ? "raw" : "image"
}

export const materialService = {
  async list() {
    const { data } = await apiClient.get<ApiSuccess<{ materials: Material[] }>>("/materials")
    return data.data.materials
  },

  async upload(file: File, title: string) {
    const { data: signatureResponse } = await apiClient.post<ApiSuccess<UploadSignature>>(
      "/materials/upload-signature"
    )
    const sig = signatureResponse.data
    const resourceType = resourceTypeFor(file.name)

    const cloudinaryForm = new FormData()
    cloudinaryForm.append("file", file)
    cloudinaryForm.append("api_key", sig.api_key)
    cloudinaryForm.append("timestamp", String(sig.timestamp))
    cloudinaryForm.append("signature", sig.signature)
    cloudinaryForm.append("public_id", sig.public_id)
    cloudinaryForm.append("folder", sig.folder)

    // Uploads straight to Cloudinary from the browser, bypassing our server entirely.
    const { data: cloudinaryResult } = await axios.post(
      `https://api.cloudinary.com/v1_1/${sig.cloud_name}/${resourceType}/upload`,
      cloudinaryForm
    )

    const { data } = await apiClient.post<ApiSuccess<Material>>("/materials", {
      title,
      public_id: cloudinaryResult.public_id,
      resource_type: cloudinaryResult.resource_type,
      original_filename: file.name,
      mime_type: file.type,
    })
    return data.data
  },

  async remove(id: string) {
    await apiClient.delete(`/materials/${id}`)
  },

  async extractText(id: string, refresh = false) {
    const { data } = await apiClient.post<ApiSuccess<{ text: string; cached: boolean }>>(
      `/materials/${id}/extract-text${refresh ? "?refresh=1" : ""}`
    )
    return data.data
  },

  async saveText(id: string, text: string) {
    const { data } = await apiClient.patch<ApiSuccess<Material>>(`/materials/${id}/text`, { text })
    return data.data
  },

  async download(id: string, filename: string) {
    const response = await apiClient.get(`/materials/${id}/download`, { responseType: "blob" })
    const url = URL.createObjectURL(response.data as Blob)
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
  },
}
