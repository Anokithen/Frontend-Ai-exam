"use client"

import { useMutation, useQuery } from "@tanstack/react-query"
import { Check, Circle, Loader2, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { getApiErrorMessage } from "@/lib/api-client"
import { examService, type GenerationStage } from "@/services/exam.service"
import { materialService } from "@/services/material.service"

const LANGUAGES = ["English", "Sinhala", "Tamil", "Hindi", "Arabic", "French", "Spanish", "Other"]

const STAGE_ICONS = {
  pending: <Circle className="size-4 shrink-0 text-muted-foreground/50" />,
  running: <Loader2 className="size-4 shrink-0 animate-spin text-primary" />,
  done: <Check className="size-4 shrink-0 text-emerald-600 dark:text-emerald-500" />,
  failed: <X className="size-4 shrink-0 text-destructive" />,
} as const

export default function NewExamPage() {
  const router = useRouter()
  const { data: materials, isLoading } = useQuery({ queryKey: ["materials"], queryFn: materialService.list })

  // Materials uploaded under the same title are one group — generation combines all of them.
  const materialGroups = Array.from(
    (materials ?? []).reduce((map, material) => {
      map.set(material.title, (map.get(material.title) ?? 0) + 1)
      return map
    }, new Map<string, number>())
  )

  const [materialTitle, setMaterialTitle] = useState<string>("")
  const [title, setTitle] = useState("")
  const [timeLimit, setTimeLimit] = useState(30)
  const [mcqCount, setMcqCount] = useState(5)
  const [structuredCount, setStructuredCount] = useState(2)
  const [essayCount, setEssayCount] = useState(1)
  const [language, setLanguage] = useState("English")
  const [customLanguage, setCustomLanguage] = useState("")
  const [progress, setProgress] = useState<string | null>(null)
  const [stages, setStages] = useState<GenerationStage[] | null>(null)

  const group = (materials ?? []).filter((m) => m.title === materialTitle)
  // A typed PDF's text is read locally and is there straight away; a scanned one is read by
  // the AI a page at a time, so it can take a while the first time. An image's text is only
  // there once the AI has read it during a previous generation — the first run reads it as a
  // visible stage.
  const readableGroup = group.filter((m) => m.file_type === "pdf" || m.has_text)
  const unreadGroup = group.filter((m) => m.file_type === "image" && !m.has_text)
  const effectiveLanguage = language === "Other" ? customLanguage.trim() : language

  // Text is normally already stored from upload time, so this resolves instantly; it only
  // runs the slow extraction for materials uploaded before the text was being saved.
  const { data: extracted, isFetching: isLoadingText } = useQuery({
    queryKey: ["material-text", materialTitle],
    enabled: readableGroup.length > 0,
    // Reading a file can take a minute; don't silently repeat it on failure or refocus.
    retry: false,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const results: { id: string; filename: string; text: string }[] = []
      for (let i = 0; i < readableGroup.length; i++) {
        setProgress(
          `Loading text from file ${i + 1} of ${readableGroup.length}` +
            " (a scanned file is read page by page and can take a few minutes)..."
        )
        const { text } = await materialService.extractText(readableGroup[i].id)
        results.push({ id: readableGroup[i].id, filename: readableGroup[i].original_filename, text })
      }
      setProgress(null)
      return results
    },
  })

  const [texts, setTexts] = useState<Record<string, string>>({})
  useEffect(() => {
    if (extracted) setTexts(Object.fromEntries(extracted.map((item) => [item.id, item.text])))
  }, [extracted])

  const combinedText = (extracted ?? [])
    .map((item) => texts[item.id] ?? "")
    .filter((text) => text.trim())
    .join("\n\n")

  const saveTextMutation = useMutation({
    mutationFn: (materialId: string) => materialService.saveText(materialId, texts[materialId] ?? ""),
    onSuccess: () => toast.success("Text saved."),
    onError: (error) => toast.error(getApiErrorMessage(error, "Failed to save text.")),
  })

  const rereadMutation = useMutation({
    mutationFn: async (materialId: string) => {
      const { text } = await materialService.extractText(materialId, true)
      return { materialId, text }
    },
    onSuccess: ({ materialId, text }) => {
      setTexts((current) => ({ ...current, [materialId]: text }))
      toast.success("File read again.")
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Failed to read the file.")),
  })

  const generateMutation = useMutation({
    mutationFn: async () => {
      setStages(null)
      setProgress(null)
      return examService.generateStreamed(
        {
          material_title: materialTitle,
          title: title || materialTitle || "Untitled exam",
          time_limit_minutes: timeLimit,
          question_counts: { mcq: mcqCount, structured: structuredCount, essay: essayCount },
          language: effectiveLanguage,
          texts,
        },
        (event) => {
          if (event.type === "stages") {
            setStages(event.stages)
          } else if (event.type === "stage") {
            setStages((current) =>
              (current ?? []).map((stage) =>
                stage.id === event.id
                  ? { ...stage, status: event.status, detail: event.detail ?? stage.detail }
                  : stage
              )
            )
          }
        }
      )
    },
    onSuccess: (exam) => {
      toast.success("Exam generated. Review the questions before publishing.")
      router.push(`/teacher/exams/${exam.id}`)
    },
    onError: (error) =>
      toast.error(
        error instanceof Error ? error.message : getApiErrorMessage(error, "Failed to generate exam.")
      ),
    onSettled: () => setProgress(null),
  })

  return (
    <DashboardShell title="New exam">
      <Card className="mx-auto max-w-xl">
        <CardHeader>
          <CardTitle>Generate an exam with AI</CardTitle>
          <CardDescription>Pick a material and choose how many of each question type you want.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="flex flex-col gap-4"
            onSubmit={(event) => {
              event.preventDefault()
              if (!materialTitle || group.length === 0) {
                toast.error("Choose a material first.")
                return
              }
              if (mcqCount + structuredCount + essayCount <= 0) {
                toast.error("Select at least one question to generate.")
                return
              }
              if (!effectiveLanguage) {
                toast.error("Enter the exam language.")
                return
              }
              if (unreadGroup.length === 0 && !combinedText.trim()) {
                toast.error("There is no text to generate from. Read the file again or type the text in.")
                return
              }
              generateMutation.mutate()
            }}
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor="material">Material</Label>
              <Select value={materialTitle} onValueChange={(value) => setMaterialTitle(value ?? "")}>
                <SelectTrigger id="material" className="w-full">
                  <SelectValue placeholder={isLoading ? "Loading materials..." : "Select a material"} />
                </SelectTrigger>
                <SelectContent>
                  {materialGroups.map(([groupTitle, count]) => (
                    <SelectItem key={groupTitle} value={groupTitle}>
                      {groupTitle}
                      {count > 1 ? ` (${count} files)` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {materials?.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Upload a PDF or image material from the dashboard first.
                </p>
              )}
            </div>

            {unreadGroup.length > 0 && (
              <div className="flex flex-col gap-2">
                <Label>Images the AI still has to read</Label>
                <p className="text-xs text-muted-foreground">
                  When you generate, each of these is sent to the AI, which reads out its text —
                  including tables and diagram labels — and the exam is then written from everything
                  it read. You can watch each step below. The text is kept, so generating again from
                  this material skips the reading.
                </p>
                <ul className="flex flex-col gap-1 rounded-lg border p-3">
                  {unreadGroup.map((item) => (
                    <li key={item.id} className="truncate text-sm">
                      {item.original_filename}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {readableGroup.length > 0 && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <Label>Extracted text</Label>
                  <span className="text-xs text-muted-foreground">
                    {combinedText.length.toLocaleString()} characters
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  This is the text read from your file(s), including any image the AI has already
                  read. Questions are made only from what is here — fix any mistakes before
                  generating.
                </p>

                {isLoadingText ? (
                  <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                    {progress ?? "Loading text..."}
                  </p>
                ) : (
                  (extracted ?? []).map((item) => (
                    <div key={item.id} className="flex flex-col gap-1.5">
                      {readableGroup.length > 1 && (
                        <span className="truncate text-xs font-medium text-muted-foreground">
                          {item.filename}
                        </span>
                      )}
                      <Textarea
                        rows={8}
                        value={texts[item.id] ?? ""}
                        onChange={(event) =>
                          setTexts((current) => ({ ...current, [item.id]: event.target.value }))
                        }
                        placeholder="No text was read from this file. Type or paste the text here."
                      />
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={saveTextMutation.isPending || !(texts[item.id] ?? "").trim()}
                          onClick={() => saveTextMutation.mutate(item.id)}
                        >
                          Save text
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={rereadMutation.isPending}
                          onClick={() => rereadMutation.mutate(item.id)}
                        >
                          {rereadMutation.isPending ? "Reading..." : "Read file again"}
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Label htmlFor="title">Exam title</Label>
              <Input
                id="title"
                placeholder="e.g. Chapter 4 quiz"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="language">Exam language</Label>
              <Select value={language} onValueChange={(value) => setLanguage(value ?? "English")}>
                <SelectTrigger id="language" className="w-full">
                  <SelectValue placeholder="Select a language" />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((lang) => (
                    <SelectItem key={lang} value={lang}>
                      {lang}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {language === "Other" && (
                <Input
                  placeholder="Enter language (e.g. German)"
                  value={customLanguage}
                  onChange={(event) => setCustomLanguage(event.target.value)}
                />
              )}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="mcq">MCQ</Label>
                <Input
                  id="mcq"
                  type="number"
                  min={0}
                  value={mcqCount}
                  onChange={(event) => setMcqCount(Number(event.target.value))}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="structured">Structured</Label>
                <Input
                  id="structured"
                  type="number"
                  min={0}
                  value={structuredCount}
                  onChange={(event) => setStructuredCount(Number(event.target.value))}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="essay">Essay</Label>
                <Input
                  id="essay"
                  type="number"
                  min={0}
                  value={essayCount}
                  onChange={(event) => setEssayCount(Number(event.target.value))}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="time-limit">Time limit (minutes)</Label>
              <Input
                id="time-limit"
                type="number"
                min={1}
                value={timeLimit}
                onChange={(event) => setTimeLimit(Number(event.target.value))}
              />
            </div>

            {stages && (
              <div className="flex flex-col gap-2 rounded-lg border p-3">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                  Progress
                </Label>
                <ul className="flex flex-col gap-2">
                  {stages.map((stage) => (
                    <li key={stage.id} className="flex items-start gap-2 text-sm">
                      {STAGE_ICONS[stage.status]}
                      <span className="flex flex-col">
                        <span
                          className={
                            stage.status === "pending"
                              ? "text-muted-foreground"
                              : stage.status === "failed"
                                ? "text-destructive"
                                : undefined
                          }
                        >
                          {stage.label}
                        </span>
                        {stage.detail && (
                          <span className="text-xs text-muted-foreground">{stage.detail}</span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <Button type="submit" disabled={generateMutation.isPending}>
              {generateMutation.isPending ? progress ?? "Generating with AI..." : "Generate exam"}
            </Button>
            {generateMutation.isPending && progress && (
              <p className="text-center text-xs text-muted-foreground">{progress}</p>
            )}
          </form>
        </CardContent>
      </Card>
    </DashboardShell>
  )
}
