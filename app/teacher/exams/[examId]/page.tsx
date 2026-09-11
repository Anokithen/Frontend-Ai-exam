"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import {
  Circle,
  CircleCheck,
  Clock,
  DoorOpen,
  Download,
  KeyRound,
  LoaderCircle,
  Plus,
  Save,
  Send,
  Trash2,
  Users,
  X,
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { getApiErrorMessage } from "@/lib/api-client"
import { examService, type QuestionInput } from "@/services/exam.service"

let nextTempId = 1

function withKey(questions: QuestionInput[]): (QuestionInput & { _key: string })[] {
  return questions.map((q) => ({ ...q, _key: q.id ?? `new-${nextTempId++}` }))
}

const TYPE_LABEL: Record<QuestionInput["type"], string> = {
  mcq: "Multiple choice",
  structured: "Structured",
  essay: "Essay",
}

/** Each question type keeps one hue across the app, so a paper's shape reads at a glance. */
const TYPE_COLOR: Record<QuestionInput["type"], string> = {
  mcq: "text-[#4dd8a0]",
  structured: "text-[#7bc6ff]",
  essay: "text-[#c9a6ff]",
}

export default function ExamEditorPage() {
  const params = useParams<{ examId: string }>()
  const examId = params.examId
  const router = useRouter()
  const queryClient = useQueryClient()

  const { data: exam, isLoading } = useQuery({
    queryKey: ["exams", examId],
    queryFn: () => examService.get(examId),
  })
  const { data: rooms } = useQuery({
    queryKey: ["exams", examId, "rooms"],
    queryFn: () => examService.listRooms(examId),
    enabled: exam?.status === "published",
  })

  const [title, setTitle] = useState("")
  const [instructions, setInstructions] = useState("")
  const [timeLimit, setTimeLimit] = useState(60)
  const [questions, setQuestions] = useState<(QuestionInput & { _key: string })[]>([])

  useEffect(() => {
    if (exam) {
      setTitle(exam.title)
      setInstructions(exam.instructions ?? "")
      setTimeLimit(exam.time_limit_minutes)
      setQuestions(withKey(exam.questions ?? []))
    }
  }, [exam])

  const saveMutation = useMutation({
    mutationFn: () =>
      examService.update(examId, {
        title,
        instructions,
        time_limit_minutes: timeLimit,
        questions: questions.map(({ _key, ...q }) => q),
      }),
    onSuccess: (updated) => {
      toast.success("Exam saved.")
      queryClient.setQueryData(["exams", examId], updated)
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Failed to save exam.")),
  })

  const publishMutation = useMutation({
    mutationFn: () => examService.publish(examId),
    onSuccess: (updated) => {
      toast.success("Exam published. You can now create a room.")
      queryClient.setQueryData(["exams", examId], updated)
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Failed to publish exam.")),
  })

  const createRoomMutation = useMutation({
    mutationFn: () => examService.createRoom(examId),
    onSuccess: (room) => {
      toast.success(`Room created — invite code ${room.invite_code}`)
      router.push(`/teacher/rooms/${room.id}`)
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Failed to create room.")),
  })

  const deleteMutation = useMutation({
    mutationFn: () => examService.remove(examId),
    onSuccess: () => {
      toast.success("Draft deleted.")
      queryClient.removeQueries({ queryKey: ["exams", examId] })
      queryClient.invalidateQueries({ queryKey: ["exams"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })
      router.push("/teacher/exams")
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Failed to delete draft.")),
  })

  function updateQuestion(key: string, patch: Partial<QuestionInput>) {
    setQuestions((prev) => prev.map((q) => (q._key === key ? { ...q, ...patch } : q)))
  }

  function removeQuestion(key: string) {
    setQuestions((prev) => prev.filter((q) => q._key !== key))
  }

  function addQuestion(type: QuestionInput["type"]) {
    const base: QuestionInput = { type, prompt: "", marks: type === "mcq" ? 1 : type === "structured" ? 5 : 10 }
    if (type === "mcq") {
      base.options = ["", "", "", ""]
      base.correct_option_index = 0
    }
    setQuestions((prev) => [...prev, { ...base, _key: `new-${nextTempId++}` }])
  }

  if (isLoading || !exam) {
    return (
      <DashboardShell title="Exam">
        <p className="text-sm text-muted-foreground">Loading exam...</p>
      </DashboardShell>
    )
  }

  const totalMarks = questions.reduce((sum, question) => sum + (question.marks || 0), 0)
  const countOf = (type: QuestionInput["type"]) => questions.filter((q) => q.type === type).length

  return (
    <DashboardShell title="Edit exam">
      {/* The title is the page heading and the field for it at once. */}
      <div className="mb-7 flex flex-wrap items-center gap-4">
        <div className="min-w-[240px] flex-1">
          <Input
            aria-label="Exam title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="h-auto py-3.5 font-heading text-[21px] font-semibold tracking-tight"
          />
          <div className="mt-2.5 text-[13.5px] text-nm-dim">
            {questions.length} questions · {totalMarks} marks · {timeLimit} min · {exam.language}
          </div>
        </div>
        <Badge variant={exam.status === "published" ? "success" : "secondary"}>{exam.status}</Badge>
        <Button variant="outline" onClick={() => examService.downloadPdf(examId, title, false)}>
          <Download className="size-4" />
          Exam PDF
        </Button>
        <Button variant="outline" onClick={() => examService.downloadPdf(examId, title, true)}>
          <Download className="size-4" />
          With answer key
        </Button>
        {exam.status === "draft" && (
          <Button onClick={() => publishMutation.mutate()} disabled={publishMutation.isPending}>
            {publishMutation.isPending ? <LoaderCircle className="animate-spin" /> : <Send />}
            {publishMutation.isPending ? "Publishing..." : "Publish exam"}
          </Button>
        )}
        {exam.status === "published" && (
          <Button onClick={() => createRoomMutation.mutate()} disabled={createRoomMutation.isPending}>
            {createRoomMutation.isPending ? <LoaderCircle className="animate-spin" /> : <DoorOpen />}
            {createRoomMutation.isPending ? "Creating room..." : "Create exam room"}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(300px,100%),1fr))] items-start gap-6">
        <div className="flex min-w-0 flex-col gap-4">
          {questions.map((question, index) => (
            <div key={question._key} className="rounded-3xl bg-background px-4 py-5 shadow-nm-md sm:px-6 sm:py-6">
              <div className="mb-4 flex flex-wrap items-center gap-3.5">
                <span className="grid size-9 place-items-center rounded-xl bg-background font-heading text-[13.5px] text-nm-accent-bright shadow-nm-xs">
                  {index + 1}
                </span>
                <span
                  className={cn(
                    "rounded-full bg-background px-3.5 py-1.5 text-[11.5px] tracking-wide shadow-nm-inset-sm",
                    TYPE_COLOR[question.type]
                  )}
                >
                  {TYPE_LABEL[question.type]}
                </span>
                <div className="ml-auto flex items-center gap-2">
                  <Label htmlFor={`marks-${question._key}`} className="text-[12.5px] font-normal text-nm-dim">
                    Marks
                  </Label>
                  <Input
                    id={`marks-${question._key}`}
                    type="number"
                    min={1}
                    className="h-9 w-16 text-center text-sm"
                    value={question.marks}
                    onChange={(event) =>
                      updateQuestion(question._key, { marks: Math.max(1, Number(event.target.value) || 1) })
                    }
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Remove question ${index + 1}`}
                  onClick={() => removeQuestion(question._key)}
                >
                  <X className="size-4" />
                </Button>
              </div>

              <Textarea
                aria-label={`Question ${index + 1} prompt`}
                value={question.prompt}
                onChange={(event) => updateQuestion(question._key, { prompt: event.target.value })}
                placeholder="Question prompt"
                className={question.type === "mcq" ? "min-h-[58px]" : "min-h-[84px]"}
              />

              {question.type === "mcq" && (
                <div className="mt-3.5 flex flex-col gap-2.5">
                  {(question.options ?? []).map((option, optIndex) => {
                    const correct = question.correct_option_index === optIndex
                    return (
                      /* The correct option lifts out of the page; the rest stay pressed in. */
                      <div
                        key={optIndex}
                        className={cn(
                          "flex items-center gap-3.5 rounded-2xl bg-background px-4 py-2.5 transition-all",
                          correct ? "shadow-nm-xs" : "shadow-nm-inset-sm"
                        )}
                      >
                        <button
                          type="button"
                          role="radio"
                          aria-checked={correct}
                          aria-label={`Mark option ${optIndex + 1} correct`}
                          onClick={() => updateQuestion(question._key, { correct_option_index: optIndex })}
                          className="shrink-0 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring/70"
                        >
                          {correct ? (
                            <CircleCheck className="size-4 text-nm-success drop-shadow-[0_0_10px_rgb(77_216_160_/_0.75)]" />
                          ) : (
                            <Circle className="size-4 text-[#33465a]" />
                          )}
                        </button>
                        <Input
                          value={option}
                          aria-label={`Option ${optIndex + 1}`}
                          onChange={(event) => {
                            const options = [...(question.options ?? [])]
                            options[optIndex] = event.target.value
                            updateQuestion(question._key, { options })
                          }}
                          placeholder={`Option ${optIndex + 1}`}
                          className={cn(
                            "h-9 flex-1 bg-transparent px-0 text-[14.3px] shadow-none focus-visible:shadow-none",
                            correct ? "text-foreground" : "text-[#93a6bd]"
                          )}
                        />
                        {correct && (
                          <span className="text-[11px] tracking-wider text-nm-success uppercase">correct</span>
                        )}
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Remove option ${optIndex + 1}`}
                          onClick={() => {
                            const options = (question.options ?? []).filter((_, i) => i !== optIndex)
                            const nextCorrect =
                              question.correct_option_index === optIndex ? 0 : question.correct_option_index
                            updateQuestion(question._key, { options, correct_option_index: nextCorrect })
                          }}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    )
                  })}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-fit"
                    onClick={() => updateQuestion(question._key, { options: [...(question.options ?? []), ""] })}
                  >
                    <Plus className="size-3.5" />
                    Add option
                  </Button>
                </div>
              )}
            </div>
          ))}

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => addQuestion("mcq")}>
              <Plus className="size-4" /> MCQ
            </Button>
            <Button variant="outline" size="sm" onClick={() => addQuestion("structured")}>
              <Plus className="size-4" /> Structured
            </Button>
            <Button variant="outline" size="sm" onClick={() => addQuestion("essay")}>
              <Plus className="size-4" /> Essay
            </Button>
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-5 md:sticky md:top-24">
          <Card>
            <CardHeader>
              <CardTitle>Paper summary</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3.5">
              {[
                { label: "Questions", value: String(questions.length) },
                { label: "Total marks", value: String(totalMarks) },
                { label: "Multiple choice", value: String(countOf("mcq")) },
                { label: "Structured / essay", value: `${countOf("structured")} / ${countOf("essay")}` },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between rounded-2xl bg-background px-4 py-3.5 shadow-nm-inset-sm"
                >
                  <span className="text-[13.5px] text-[#93a6bd]">{row.label}</span>
                  <span className="font-heading text-[14.5px]">{row.value}</span>
                </div>
              ))}
              <div className="flex items-center justify-between rounded-2xl bg-background px-4 py-3.5 shadow-nm-inset-sm">
                <Label htmlFor="exam-time-limit" className="flex items-center gap-2 text-[13.5px] font-normal text-[#93a6bd]">
                  <Clock className="size-3.5" />
                  Time limit (min)
                </Label>
                <Input
                  id="exam-time-limit"
                  type="number"
                  min={1}
                  value={timeLimit}
                  onChange={(event) => setTimeLimit(Math.max(1, Number(event.target.value) || 1))}
                  className="h-9 w-20 bg-transparent text-center font-heading text-[14.5px] shadow-none"
                />
              </div>
            </CardContent>
          </Card>

          <div className="rounded-3xl bg-background p-7 shadow-nm-inset-lg">
            <h3 className="mb-3 font-heading text-[17px] font-semibold">Instructions to students</h3>
            <Textarea
              aria-label="Instructions to students"
              value={instructions}
              onChange={(event) => setInstructions(event.target.value)}
              placeholder="Answer all questions. Write your index number on every sheet."
              className="min-h-[110px]"
            />
            <Button
              variant="outline"
              className="mt-4 w-full"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? <LoaderCircle className="animate-spin" /> : <Save />}
              {saveMutation.isPending ? "Saving..." : "Save changes"}
            </Button>
            {exam.status === "draft" && (
              <Button
                variant="ghost"
                className="mt-2 w-full text-destructive"
                disabled={deleteMutation.isPending}
                onClick={() => {
                  if (window.confirm(`Delete draft "${exam.title}"? This cannot be undone.`)) {
                    deleteMutation.mutate()
                  }
                }}
              >
                <Trash2 className="size-4" />
                {deleteMutation.isPending ? "Deleting..." : "Delete draft"}
              </Button>
            )}
          </div>

          {exam.status === "published" && rooms && rooms.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Rooms</CardTitle>
                <CardDescription>Previously created rooms for this exam.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-2.5">
                {rooms.map((room) => (
                  <Link
                    key={room.id}
                    href={`/teacher/rooms/${room.id}`}
                    className="flex items-center justify-between gap-3 rounded-2xl bg-background px-4 py-3.5 text-sm text-foreground shadow-nm-sm transition-shadow hover:text-foreground hover:shadow-nm-inset"
                  >
                    <span className="flex items-center gap-2">
                      <KeyRound className="size-4 shrink-0 text-nm-dim" />
                      <strong className="font-heading tracking-[0.12em] text-nm-accent-bright">
                        {room.invite_code}
                      </strong>
                      <span className="flex items-center gap-1 text-nm-dim">
                        <Users className="size-3.5" />
                        {room.participant_count}
                      </span>
                    </span>
                    <Badge variant={room.status === "open" ? "success" : "secondary"}>{room.status}</Badge>
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardShell>
  )
}
