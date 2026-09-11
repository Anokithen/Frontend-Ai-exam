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

  const fileSummary =
    selectedFiles.length === 0
      ? "PDF, JPG or PNG · one or many"
      : selectedFiles.length === 1
        ? `${selectedFiles[0].name} · ${formatFileSize(selectedFiles[0].size)}`
        : `${selectedFiles.length} files selected — they'll share one title and group together`

  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(min(330px,100%),1fr))] items-start gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Upload material</CardTitle>
          <CardDescription>
            PDF, scan or photo. Text is extracted so you can correct it before generating.
          </CardDescription>
        </CardHeader>
        <CardContent>
        <form
          className="flex flex-col"
          onSubmit={(event) => {
            event.preventDefault()
            if (selectedFiles.length === 0) {
              toast.error("Choose a PDF or image file first.")
              return
            }
            uploadMutation.mutate()
          }}
        >
          <Label htmlFor="material-title" className="mb-2.5 text-[13px] font-normal text-[#93a6bd]">
            Title
          </Label>
          <Input
            id="material-title"
            placeholder="Photosynthesis chapter notes"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />

          {/* The drop zone is a pressed-in well: the file goes *into* the page. */}
          <label
            htmlFor="material-file"
            className="mt-6 cursor-pointer rounded-3xl bg-background px-6 py-10 text-center shadow-nm-inset transition-shadow hover:shadow-nm-inset-lg"
          >
            <span className="mx-auto mb-4 grid size-14 place-items-center rounded-[19px] bg-background shadow-nm-sm">
              <span className="nm-glow size-4 rounded-[5px]" />
            </span>
            <span className="block text-[15px]">
              {selectedFiles.length ? "Ready to upload" : "Choose a file"}
            </span>
            <span className="mt-1.5 block text-[13px] text-nm-dim">{fileSummary}</span>
          </label>
          <Input
            id="material-file"
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_TYPES}
            multiple
            className="sr-only"
            onChange={(event) => setSelectedFiles(Array.from(event.target.files ?? []))}
          />

          {uploadMutation.isPending && progress && (
            <p className="mt-5 rounded-2xl bg-background px-4 py-3 text-xs text-[#93a6bd] shadow-nm-inset-sm">
              {progress}
            </p>
          )}

          <Button type="submit" size="lg" className="mt-6 w-full" disabled={uploadMutation.isPending}>
            {uploadMutation.isPending ? "Working..." : "Upload"}
          </Button>
        </form>
        </CardContent>
      </Card>

      {/* Your materials sits in a sunken tray so the upload slab stays the focus. */}
      <div className="rounded-3xl bg-background p-7 shadow-nm-inset-lg">
        <h3 className="mb-5 font-heading text-[17px] font-semibold">Your materials</h3>
        <div className="flex flex-col gap-3">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading materials...</p>
          ) : materials?.length ? (
            materials.map((material) => (
              <div
                key={material.id}
                className="flex items-center justify-between gap-4 rounded-[18px] bg-background px-4 py-4 shadow-nm-sm"
              >
                <div className="flex items-center gap-3.5 overflow-hidden">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-background text-nm-dim shadow-nm-xs">
                    {material.file_type === "pdf" ? (
                      <FileText className="size-4" />
                    ) : (
                      <ImageIcon className="size-4" />
                    )}
                  </span>
                  <div className="flex flex-col overflow-hidden">
                    <span className="truncate text-[14.5px]">{material.title}</span>
                    <span className="truncate text-[12.5px] text-nm-dim">
                      {material.original_filename} · {formatFileSize(material.file_size)} ·{" "}
                      {material.has_text ? (
                        <span className="text-nm-success">
                          text ready ({material.text_length.toLocaleString()} chars)
                        </span>
                      ) : material.file_type === "image" ? (
                        <span className="text-nm-dim">AI reads it when you generate</span>
                      ) : (
                        <span className="text-nm-warning">text not read yet</span>
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
            <p className="rounded-2xl bg-background px-4 py-8 text-center text-sm text-muted-foreground shadow-nm-sm">
              No materials uploaded yet.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
