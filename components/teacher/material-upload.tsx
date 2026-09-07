"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { FileText, ImageIcon, Trash2, Download } from "lucide-react"
import { useRef, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getApiErrorMessage } from "@/lib/api-client"
import { materialService } from "@/services/material.service"

const ACCEPTED_TYPES = ".pdf,.png,.jpg,.jpeg,.webp"

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function MaterialUpload() {
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [title, setTitle] = useState("")
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [progress, setProgress] = useState<string | null>(null)

  const { data: materials, isLoading } = useQuery({
    queryKey: ["materials"],
    queryFn: materialService.list,
  })

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (selectedFiles.length === 0) throw new Error("No file selected")
      const sharedTitle = title || selectedFiles[0].name
      // Uploaded sequentially under the same title so they group together for exam generation.
      const failed: string[] = []
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i]
        setProgress(`Uploading ${i + 1} of ${selectedFiles.length}: ${file.name}...`)
        const material = await materialService.upload(file, sharedTitle)

        // Images are sent to the AI as images at generation time, so only PDFs need their
        // text read and stored here. A scanned PDF has no text layer and is read page by
        // page by the AI, so this step is not always quick.
        if (material.file_type === "pdf") {
          setProgress(
            `Reading text from ${i + 1} of ${selectedFiles.length}: ${file.name}` +
              " (a scan is read page by page and can take a few minutes)..."
          )
          try {
            await materialService.extractText(material.id)
          } catch {
            failed.push(file.name)
          }
        }
      }
      return failed
    },
    onSuccess: (failed) => {
      if (failed.length > 0) {
        toast.warning(
          `Uploaded, but couldn't read text from ${failed.length} file(s). Open "New exam" to retry.`
        )
      } else {
        toast.success(selectedFiles.length > 1 ? "Materials uploaded." : "Material uploaded.")
      }
      setTitle("")
      setSelectedFiles([])
      if (fileInputRef.current) fileInputRef.current.value = ""
      queryClient.invalidateQueries({ queryKey: ["materials"] })
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Upload failed.")),
    onSettled: () => setProgress(null),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => materialService.remove(id),
    onSuccess: () => {
      toast.success("Material deleted.")
      queryClient.invalidateQueries({ queryKey: ["materials"] })
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Failed to delete material.")),
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Study materials</CardTitle>
        <CardDescription>Upload a PDF or image for AI question generation.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <form
          className="flex flex-col gap-3 sm:flex-row sm:items-end"
          onSubmit={(event) => {
            event.preventDefault()
            if (selectedFiles.length === 0) {
              toast.error("Choose a PDF or image file first.")
              return
            }
            uploadMutation.mutate()
          }}
        >
          <div className="flex flex-1 flex-col gap-2">
            <Label htmlFor="material-title">Title</Label>
            <Input
              id="material-title"
              placeholder="e.g. Chapter 4 notes"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </div>
          <div className="flex flex-1 flex-col gap-2">
            <Label htmlFor="material-file">File(s) (PDF or image)</Label>
            <Input
              id="material-file"
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_TYPES}
              multiple
              onChange={(event) => setSelectedFiles(Array.from(event.target.files ?? []))}
            />
            {selectedFiles.length > 1 && (
              <p className="text-xs text-muted-foreground">
                {selectedFiles.length} files selected — they'll share one title and group together.
              </p>
            )}
          </div>
          <Button type="submit" disabled={uploadMutation.isPending}>
            {uploadMutation.isPending ? "Working..." : "Upload"}
          </Button>
        </form>
        {uploadMutation.isPending && progress && (
          <p className="-mt-3 text-xs text-muted-foreground">{progress}</p>
        )}

        <div className="flex flex-col gap-2">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading materials...</p>
          ) : materials?.length ? (
            materials.map((material) => (
              <div
                key={material.id}
                className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2"
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  {material.file_type === "pdf" ? (
                    <FileText className="size-4 shrink-0 text-muted-foreground" />
                  ) : (
                    <ImageIcon className="size-4 shrink-0 text-muted-foreground" />
                  )}
                  <div className="flex flex-col overflow-hidden">
                    <span className="truncate text-sm font-medium">{material.title}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {material.original_filename} · {formatFileSize(material.file_size)} ·{" "}
                      {material.has_text ? (
                        <span className="text-emerald-600 dark:text-emerald-500">
                          text ready ({material.text_length.toLocaleString()} chars)
                        </span>
                      ) : material.file_type === "image" ? (
                        <span className="text-muted-foreground">AI reads it when you generate</span>
                      ) : (
                        <span className="text-amber-600 dark:text-amber-500">text not read yet</span>
                      )}
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Download"
                    onClick={() => materialService.download(material.id, material.original_filename)}
                  >
                    <Download className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Delete"
                    disabled={deleteMutation.isPending}
                    onClick={() => {
                      if (window.confirm(`Delete "${material.title}"?`)) {
                        deleteMutation.mutate(material.id)
                      }
                    }}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              No materials uploaded yet.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
