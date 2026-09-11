"use client"

import { useMutation, useQuery } from "@tanstack/react-query"
import { Minus, Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { PageHeader } from "@/components/dashboard/page-header"
import { ExtractedTextDialog } from "@/components/teacher/extracted-text-dialog"
import { GenerationStages } from "@/components/teacher/generation-stages"
import { QuestionMix } from "@/components/teacher/question-mix"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getApiErrorMessage } from "@/lib/api-client"
import { examService, type GenerationStage } from "@/services/exam.service"
import { materialService } from "@/services/material.service"

const LANGUAGES = ["English", "Sinhala", "Tamil", "Hindi", "Arabic", "French", "Spanish", "Other"]

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

  const totalQuestions = mcqCount + structuredCount + essayCount
  // The backend's own weighting: 1 mark per MCQ, 4 per structured, 10 per essay.
  const totalMarks = mcqCount * 1 + structuredCount * 4 + essayCount * 10

  return (
    <DashboardShell title="New exam">
      <PageHeader title="Generate an exam" description="Pick the material and the shape of the paper." />

      <form
        className="grid grid-cols-[repeat(auto-fit,minmax(min(340px,100%),1fr))] items-start gap-6"
        onSubmit={(event) => {
          event.preventDefault()
          if (!materialTitle || group.length === 0) {
            toast.error("Choose a material first.")
            return
          }
          if (totalQuestions <= 0) {
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
        <Card>
          <CardHeader>
            <CardTitle>The paper</CardTitle>
            <CardDescription>Questions are written only from the material you pick.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col">
            <Label className="mb-3 text-[13px] font-normal text-[#93a6bd]">Material</Label>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading materials...</p>
            ) : materialGroups.length ? (
              /* The chosen material presses in; the rest stay raised. */
              <div className="flex flex-col gap-3">
                {materialGroups.map(([groupTitle, count]) => {
                  const selected = materialTitle === groupTitle
                  return (
                    <button
                      key={groupTitle}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setMaterialTitle(groupTitle)}
                      className={cn(
                        "flex items-center gap-3.5 rounded-2xl bg-background px-4 py-4 text-[14.5px] transition-all",
                        selected ? "text-foreground shadow-nm-inset" : "text-[#93a6bd] shadow-nm-sm"
                      )}
                    >
                      <span
                        className={cn(
                          "size-2.5 shrink-0 rounded-full",
                          selected ? "bg-primary shadow-[0_0_12px_rgb(77_141_255_/_0.7)]" : "bg-[#33465a]"
                        )}
                      />
                      <span className="flex-1 truncate text-left">{groupTitle}</span>
                      <span className="text-[12.5px] text-nm-dim">
                        {count > 1 ? `${count} files` : "1 file"}
                      </span>
                    </button>
                  )
                })}
              </div>
            ) : (
              <p className="rounded-2xl bg-background px-5 py-6 text-sm text-muted-foreground shadow-nm-inset">
                Upload a PDF or image material first — Materials is in the nav above.
              </p>
            )}

            {unreadGroup.length > 0 && (
              <div className="mt-5 rounded-2xl bg-background p-5 shadow-nm-inset">
                <p className="text-[13px] text-[#93a6bd]">
                  When you generate, each of these images is sent to the AI, which reads out its
                  text — including tables and diagram labels — and the exam is then written from
                  everything it read. The text is kept, so generating again skips the reading.
                </p>
                <ul className="mt-3 flex flex-col gap-1">
                  {unreadGroup.map((item) => (
                    <li key={item.id} className="truncate text-[13px] text-nm-dim">
                      {item.original_filename}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {readableGroup.length > 0 && (
              <div className="mt-5 flex flex-col gap-2">
                <Label className="text-[13px] font-normal text-[#93a6bd]">Extracted text</Label>
                <ExtractedTextDialog
                  files={(extracted ?? []).map((item) => ({ id: item.id, filename: item.filename }))}
                  texts={texts}
                  onTextChange={(materialId, value) =>
                    setTexts((current) => ({ ...current, [materialId]: value }))
                  }
                  onSave={(materialId) => saveTextMutation.mutate(materialId)}
                  onReread={(materialId) => rereadMutation.mutate(materialId)}
                  isSaving={saveTextMutation.isPending}
                  isRereading={rereadMutation.isPending}
                  isLoading={isLoadingText}
                  loadingMessage={progress}
                  totalCharacters={combinedText.length}
                />
                <p className="text-xs text-muted-foreground">
                  Questions are made only from this text — open it to check or fix what was read
                  before generating.
                </p>
              </div>
            )}

            <Label htmlFor="title" className="mt-6 mb-2.5 text-[13px] font-normal text-[#93a6bd]">
              Exam title
            </Label>
            <Input
              id="title"
              placeholder="e.g. Chapter 4 quiz"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="time-limit" className="mb-2.5 text-[13px] font-normal text-[#93a6bd]">
                  Time limit
                </Label>
                {/* Stepper in a sunken well: the buttons are the only raised things in it. */}
                <div className="flex items-center gap-3 rounded-2xl bg-background p-2 shadow-nm-inset">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    aria-label="Five minutes less"
                    onClick={() => setTimeLimit((minutes) => Math.max(1, minutes - 5))}
                  >
                    <Minus className="size-4" />
                  </Button>
                  <Input
                    id="time-limit"
                    type="number"
                    min={1}
                    value={timeLimit}
                    onChange={(event) => setTimeLimit(Math.max(1, Number(event.target.value) || 1))}
                    className="h-9 flex-1 bg-transparent text-center font-heading text-base shadow-none"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    aria-label="Five minutes more"
                    onClick={() => setTimeLimit((minutes) => minutes + 5)}
                  >
                    <Plus className="size-4" />
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="language" className="mb-2.5 text-[13px] font-normal text-[#93a6bd]">
                  Language
                </Label>
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
                    className="mt-3"
                  />
                )}
              </div>
            </div>

            <Label className="mt-7 mb-3.5 text-[13px] font-normal text-[#93a6bd]">Question mix</Label>
            <div className="flex flex-col gap-5">
              <QuestionMix
                id="mcq"
                label="Multiple choice · 1 mark"
                count={mcqCount}
                onChange={setMcqCount}
                pips={20}
              />
              <QuestionMix
                id="structured"
                label="Structured · 4 marks"
                count={structuredCount}
                onChange={setStructuredCount}
                pips={12}
              />
              <QuestionMix
                id="essay"
                label="Essay · 10 marks"
                count={essayCount}
                onChange={setEssayCount}
                pips={6}
              />
            </div>

            <div className="mt-7 flex items-center justify-between rounded-[18px] bg-background px-5 py-4 shadow-nm-inset">
              <span className="text-sm text-[#93a6bd]">Total</span>
              <span className="font-heading text-base">
                {totalQuestions} questions · {totalMarks} marks
              </span>
            </div>

            <Button type="submit" size="lg" className="mt-5 w-full" disabled={generateMutation.isPending}>
              {generateMutation.isPending ? "Generating..." : "Generate exam"}
            </Button>
            {generateMutation.isPending && progress && (
              <p className="mt-3 text-center text-xs text-muted-foreground">{progress}</p>
            )}
          </CardContent>
        </Card>

        <GenerationStages stages={stages} isPending={generateMutation.isPending} />
      </form>
    </DashboardShell>
  )
}
